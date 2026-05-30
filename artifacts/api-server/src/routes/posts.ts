import { Router } from "express";
import { db } from "@workspace/db";
import { posts, postLikes, socialUsers } from "@workspace/db";
import { eq, desc, and, inArray, sql } from "drizzle-orm";

const router = Router();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function userId(req: import("express").Request): string | null {
  const id = req.headers["x-social-id"] as string | undefined;
  return id && UUID_RE.test(id) ? id : null;
}

/** GET /api/social/posts */
router.get("/social/posts", async (req, res) => {
  const me = userId(req);
  const limit = Math.min(Number(req.query.limit ?? 30), 100);

  const rows = await db.select({
    id: posts.id, content: posts.content, imageUrl: posts.imageUrl,
    postType: posts.postType, roomId: posts.roomId,
    roomName: posts.roomName, inviteCode: posts.inviteCode,
    likesCount: posts.likesCount, createdAt: posts.createdAt,
    authorId: posts.authorId,
    authorUsername: socialUsers.username,
    authorName: socialUsers.name,
    authorXp: socialUsers.xp, authorLevel: socialUsers.level,
  }).from(posts)
    .leftJoin(socialUsers, eq(posts.authorId, socialUsers.id))
    .orderBy(desc(posts.createdAt))
    .limit(limit);

  // Check which posts me has liked
  let myLikes: Set<string> = new Set();
  if (me && rows.length) {
    const postIds = rows.map(r => r.id);
    const likes = await db.select({ postId: postLikes.postId }).from(postLikes)
      .where(and(eq(postLikes.userId, me), inArray(postLikes.postId, postIds)));
    myLikes = new Set(likes.map(l => l.postId));
  }

  res.json(rows.map(r => ({ ...r, liked: myLikes.has(r.id) })));
});

/** POST /api/social/posts */
router.post("/social/posts", async (req, res) => {
  const me = userId(req);
  if (!me) { res.status(401).json({ error: "x-social-id required" }); return; }

  const { content, postType, imageUrl, roomId, roomName, inviteCode } = req.body as {
    content: string; postType?: "text" | "image" | "room_share";
    imageUrl?: string; roomId?: string; roomName?: string; inviteCode?: string;
  };

  if (!content?.trim()) { res.status(400).json({ error: "content required" }); return; }

  const [post] = await db.insert(posts).values({
    authorId: me,
    content: content.trim(),
    postType: postType ?? "text",
    imageUrl: imageUrl ?? undefined,
    roomId: roomId ?? undefined,
    roomName: roomName ?? undefined,
    inviteCode: inviteCode ?? undefined,
  }).returning();

  const [author] = await db.select({ username: socialUsers.username, name: socialUsers.name })
    .from(socialUsers).where(eq(socialUsers.id, me)).limit(1);

  res.json({ ...post, authorUsername: author?.username, authorName: author?.name, liked: false });
});

/** POST /api/social/posts/:id/like — toggle like */
router.post("/social/posts/:id/like", async (req, res) => {
  const me = userId(req);
  if (!me) { res.status(401).json({ error: "x-social-id required" }); return; }

  const postId = req.params.id;
  const existing = await db.select().from(postLikes)
    .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, me))).limit(1);

  let liked: boolean;
  if (existing.length > 0) {
    await db.delete(postLikes).where(and(eq(postLikes.postId, postId), eq(postLikes.userId, me)));
    await db.update(posts).set({ likesCount: sql`${posts.likesCount} - 1` }).where(eq(posts.id, postId));
    liked = false;
  } else {
    await db.insert(postLikes).values({ postId, userId: me });
    await db.update(posts).set({ likesCount: sql`${posts.likesCount} + 1` }).where(eq(posts.id, postId));
    liked = true;
  }

  const [updated] = await db.select({ likesCount: posts.likesCount }).from(posts).where(eq(posts.id, postId)).limit(1);
  res.json({ liked, likesCount: updated?.likesCount ?? 0 });
});

/** DELETE /api/social/posts/:id */
router.delete("/social/posts/:id", async (req, res) => {
  const me = userId(req);
  if (!me) { res.status(401).json({ error: "x-social-id required" }); return; }
  const [post] = await db.select().from(posts).where(eq(posts.id, req.params.id)).limit(1);
  if (!post || post.authorId !== me) { res.status(403).json({ error: "forbidden" }); return; }
  await db.delete(posts).where(eq(posts.id, req.params.id));
  res.json({ ok: true });
});

export default router;
