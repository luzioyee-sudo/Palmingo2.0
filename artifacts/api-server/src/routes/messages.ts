import { Router } from "express";
import { db } from "@workspace/db";
import { directMessages, socialUsers, friendships } from "@workspace/db";
import { eq, or, and, asc, desc, inArray } from "drizzle-orm";

const router = Router();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function userId(req: import("express").Request): string | null {
  const id = req.headers["x-social-id"] as string | undefined;
  return id && UUID_RE.test(id) ? id : null;
}

/** GET /api/social/conversations — list all DM threads */
router.get("/social/conversations", async (req, res) => {
  const me = userId(req);
  if (!me) { res.status(401).json({ error: "x-social-id required" }); return; }

  // Get accepted friends
  const friendRows = await db.select().from(friendships).where(
    and(
      or(eq(friendships.requesterId, me), eq(friendships.addresseeId, me)),
      eq(friendships.status, "accepted"),
    )
  );

  const friendIds = friendRows.map(f => f.requesterId === me ? f.addresseeId : f.requesterId);
  if (!friendIds.length) { res.json([]); return; }

  // For each friend, get last message + unread count
  const friendUsers = await db.select().from(socialUsers).where(inArray(socialUsers.id, friendIds));

  const conversations = await Promise.all(friendUsers.map(async (friend) => {
    const msgs = await db.select().from(directMessages)
      .where(or(
        and(eq(directMessages.fromId, me), eq(directMessages.toId, friend.id)),
        and(eq(directMessages.fromId, friend.id), eq(directMessages.toId, me)),
      ))
      .orderBy(desc(directMessages.createdAt))
      .limit(1);

    const unread = await db.select().from(directMessages)
      .where(and(eq(directMessages.fromId, friend.id), eq(directMessages.toId, me), eq(directMessages.read, false)));

    return {
      friend,
      lastMessage: msgs[0] ?? null,
      unreadCount: unread.length,
    };
  }));

  // Sort by latest message
  conversations.sort((a, b) => {
    const ta = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const tb = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return tb - ta;
  });

  res.json(conversations);
});

/** GET /api/social/messages/:friendId — get conversation with a friend */
router.get("/social/messages/:friendId", async (req, res) => {
  const me = userId(req);
  if (!me) { res.status(401).json({ error: "x-social-id required" }); return; }

  const friendId = req.params.friendId;
  const msgs = await db.select().from(directMessages)
    .where(or(
      and(eq(directMessages.fromId, me), eq(directMessages.toId, friendId)),
      and(eq(directMessages.fromId, friendId), eq(directMessages.toId, me)),
    ))
    .orderBy(asc(directMessages.createdAt))
    .limit(100);

  // Mark incoming as read
  await db.update(directMessages)
    .set({ read: true })
    .where(and(eq(directMessages.fromId, friendId), eq(directMessages.toId, me), eq(directMessages.read, false)));

  res.json(msgs);
});

/** POST /api/social/messages — send message (HTTP fallback) */
router.post("/social/messages", async (req, res) => {
  const me = userId(req);
  if (!me) { res.status(401).json({ error: "x-social-id required" }); return; }

  const { toId, content, roomId, roomName, inviteCode } = req.body as {
    toId: string; content: string;
    roomId?: string; roomName?: string; inviteCode?: string;
  };
  if (!toId || !content) { res.status(400).json({ error: "toId and content required" }); return; }

  const [msg] = await db.insert(directMessages).values({
    fromId: me, toId, content,
    msgType: roomId ? "room_share" : "text",
    roomId: roomId ?? undefined, roomName, inviteCode,
  }).returning();

  res.json(msg);
});

export default router;
