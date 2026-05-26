import { Router } from "express";
import { db } from "@workspace/db";
import {
  socialUsers, friendships, rooms, roomMembers, roomMessages,
} from "@workspace/db";
import { eq, or, and, ilike, ne, inArray } from "drizzle-orm";
import crypto from "node:crypto";

const router = Router();

/* ── helpers ──────────────────────────────────────────── */
function genInviteCode() {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUUID(s: string): boolean { return UUID_RE.test(s); }

function userId(req: import("express").Request): string | null {
  const id = req.headers["x-social-id"] as string | undefined;
  return id && isValidUUID(id) ? id : null;
}

/* ═══════════════════════════════════════════════════════
   USERS
══════════════════════════════════════════════════════════ */

/** POST /api/social/register — create or update profile */
router.post("/social/register", async (req, res) => {
  const { id, username, name, xp, streak, level } = req.body as {
    id: string; username: string; name: string;
    xp: number; streak: number; level: string;
  };

  if (!id || !username || !name) {
    res.status(400).json({ error: "id, username, name required" });
    return;
  }

  const slug = username.toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (slug.length < 3) {
    res.status(400).json({ error: "username must be ≥3 alphanumeric chars" });
    return;
  }

  const existing = await db.select().from(socialUsers).where(eq(socialUsers.id, id)).limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(socialUsers)
      .set({ name, xp: xp ?? 0, streak: streak ?? 0, level: level ?? "A1" })
      .where(eq(socialUsers.id, id))
      .returning();
    res.json(updated);
    return;
  }

  // Check username uniqueness
  const taken = await db.select({ id: socialUsers.id }).from(socialUsers)
    .where(eq(socialUsers.username, slug)).limit(1);
  if (taken.length > 0) {
    res.status(409).json({ error: "username_taken" });
    return;
  }

  const [created] = await db.insert(socialUsers).values({
    id, username: slug, name, xp: xp ?? 0, streak: streak ?? 0, level: level ?? "A1",
  }).returning();

  res.json(created);
});

/** GET /api/social/users/search?q=... — search by username */
router.get("/social/users/search", async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  const me = userId(req);
  if (!q) { res.json([]); return; }

  const results = await db.select({
    id: socialUsers.id, username: socialUsers.username,
    name: socialUsers.name, xp: socialUsers.xp,
    streak: socialUsers.streak, level: socialUsers.level,
  }).from(socialUsers)
    .where(
      me
        ? and(ilike(socialUsers.username, `%${q}%`), ne(socialUsers.id, me))
        : ilike(socialUsers.username, `%${q}%`)
    )
    .limit(10);

  res.json(results);
});

/** GET /api/social/users/:id */
router.get("/social/users/:id", async (req, res) => {
  const [user] = await db.select().from(socialUsers)
    .where(eq(socialUsers.id, req.params.id)).limit(1);
  if (!user) { res.status(404).json({ error: "not found" }); return; }
  res.json(user);
});

/* ═══════════════════════════════════════════════════════
   FRIENDS
══════════════════════════════════════════════════════════ */

/** GET /api/social/friends — list my friends + pending */
router.get("/social/friends", async (req, res) => {
  const me = userId(req);
  if (!me) { res.status(401).json({ error: "x-social-id required" }); return; }

  const rows = await db.select().from(friendships)
    .where(or(eq(friendships.requesterId, me), eq(friendships.addresseeId, me)));

  // Enrich with user info
  const otherIds = rows.map(r => r.requesterId === me ? r.addresseeId : r.requesterId);
  const users = otherIds.length
    ? await db.select().from(socialUsers).where(inArray(socialUsers.id, otherIds))
    : [];

  const usersById = Object.fromEntries(users.map(u => [u.id, u]));

  const result = rows.map(r => ({
    ...r,
    other: usersById[r.requesterId === me ? r.addresseeId : r.requesterId] ?? null,
    direction: r.requesterId === me ? "sent" : "received",
  }));

  res.json(result);
});

/** POST /api/social/friends/request */
router.post("/social/friends/request", async (req, res) => {
  const me = userId(req);
  const { addresseeId } = req.body as { addresseeId: string };
  if (!me || !addresseeId) { res.status(400).json({ error: "missing fields" }); return; }
  if (me === addresseeId) { res.status(400).json({ error: "cannot add yourself" }); return; }

  // Check if friendship already exists
  const existing = await db.select().from(friendships).where(
    or(
      and(eq(friendships.requesterId, me), eq(friendships.addresseeId, addresseeId)),
      and(eq(friendships.requesterId, addresseeId), eq(friendships.addresseeId, me)),
    )
  ).limit(1);
  if (existing.length > 0) { res.status(409).json({ error: "already_exists", row: existing[0] }); return; }

  const [row] = await db.insert(friendships).values({
    requesterId: me, addresseeId, status: "pending",
  }).returning();
  res.json(row);
});

/** POST /api/social/friends/respond */
router.post("/social/friends/respond", async (req, res) => {
  const me = userId(req);
  const { friendshipId, accept } = req.body as { friendshipId: string; accept: boolean };
  if (!me || !friendshipId) { res.status(400).json({ error: "missing fields" }); return; }

  const [row] = await db.select().from(friendships).where(eq(friendships.id, friendshipId)).limit(1);
  if (!row) { res.status(404).json({ error: "not found" }); return; }
  if (row.addresseeId !== me) { res.status(403).json({ error: "forbidden" }); return; }

  const [updated] = await db.update(friendships)
    .set({ status: accept ? "accepted" : "rejected" })
    .where(eq(friendships.id, friendshipId))
    .returning();
  res.json(updated);
});

/** DELETE /api/social/friends/:id */
router.delete("/social/friends/:id", async (req, res) => {
  const me = userId(req);
  const fid = req.params.id;
  if (!me) { res.status(401).json({ error: "x-social-id required" }); return; }

  await db.delete(friendships).where(
    and(
      eq(friendships.id, fid),
      or(eq(friendships.requesterId, me), eq(friendships.addresseeId, me)),
    )
  );
  res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════════
   ROOMS
══════════════════════════════════════════════════════════ */

/** GET /api/social/rooms — rooms I'm in + public rooms */
router.get("/social/rooms", async (req, res) => {
  const me = userId(req);
  if (!me) { res.status(401).json({ error: "x-social-id required" }); return; }

  // Rooms I'm a member of
  const myMemberships = await db.select({ roomId: roomMembers.roomId })
    .from(roomMembers).where(eq(roomMembers.userId, me));
  const myRoomIds = myMemberships.map(m => m.roomId);

  const allRooms = myRoomIds.length
    ? await db.select().from(rooms).where(
        or(
          inArray(rooms.id, myRoomIds),
          eq(rooms.isPublic, true),
        )
      )
    : await db.select().from(rooms).where(eq(rooms.isPublic, true));

  // Get member counts
  const roomIds = allRooms.map(r => r.id);
  const memberCounts = roomIds.length
    ? await db.select({ roomId: roomMembers.roomId }).from(roomMembers)
        .where(inArray(roomMembers.roomId, roomIds))
    : [];

  const countMap: Record<string, number> = {};
  for (const m of memberCounts) countMap[m.roomId] = (countMap[m.roomId] ?? 0) + 1;

  res.json(allRooms.map(r => ({
    ...r,
    memberCount: countMap[r.id] ?? 0,
    isMember: myRoomIds.includes(r.id),
  })));
});

/** POST /api/social/rooms — create room */
router.post("/social/rooms", async (req, res) => {
  const me = userId(req);
  const { name, type, isPublic, maxMembers, targetLang } = req.body as {
    name: string; type: "war" | "voice"; isPublic: boolean;
    maxMembers: number; targetLang: string;
  };
  if (!me || !name) { res.status(400).json({ error: "missing fields" }); return; }

  let inviteCode = genInviteCode();
  // Ensure uniqueness
  for (let i = 0; i < 5; i++) {
    const ex = await db.select({ id: rooms.id }).from(rooms).where(eq(rooms.inviteCode, inviteCode)).limit(1);
    if (!ex.length) break;
    inviteCode = genInviteCode();
  }

  const [room] = await db.insert(rooms).values({
    name, type: type ?? "voice", adminId: me,
    inviteCode, maxMembers: maxMembers ?? 12,
    isPublic: isPublic ?? false, targetLang: targetLang ?? "English",
  }).returning();

  // Add admin as member
  await db.insert(roomMembers).values({ roomId: room.id, userId: me, role: "admin" });

  res.json(room);
});

/** GET /api/social/rooms/:id */
router.get("/social/rooms/:id", async (req, res) => {
  const [room] = await db.select().from(rooms).where(eq(rooms.id, req.params.id)).limit(1);
  if (!room) { res.status(404).json({ error: "not found" }); return; }

  const members = await db.select({
    id: roomMembers.id, roomId: roomMembers.roomId,
    userId: roomMembers.userId, role: roomMembers.role,
    muted: roomMembers.muted, joinedAt: roomMembers.joinedAt,
    username: socialUsers.username, name: socialUsers.name,
    xp: socialUsers.xp, level: socialUsers.level,
  }).from(roomMembers)
    .leftJoin(socialUsers, eq(roomMembers.userId, socialUsers.id))
    .where(eq(roomMembers.roomId, room.id));

  res.json({ ...room, members });
});

/** POST /api/social/rooms/join — join by invite code */
router.post("/social/rooms/join", async (req, res) => {
  const me = userId(req);
  const { inviteCode } = req.body as { inviteCode: string };
  if (!me || !inviteCode) { res.status(400).json({ error: "missing fields" }); return; }

  const [room] = await db.select().from(rooms)
    .where(eq(rooms.inviteCode, inviteCode.toUpperCase())).limit(1);
  if (!room) { res.status(404).json({ error: "invalid code" }); return; }

  const already = await db.select({ id: roomMembers.id }).from(roomMembers)
    .where(and(eq(roomMembers.roomId, room.id), eq(roomMembers.userId, me))).limit(1);
  if (already.length > 0) { res.json({ ...room, alreadyMember: true }); return; }

  // Check capacity
  const memberCount = await db.select({ id: roomMembers.id }).from(roomMembers)
    .where(eq(roomMembers.roomId, room.id));
  if (memberCount.length >= room.maxMembers) {
    res.status(400).json({ error: "room_full" }); return;
  }

  await db.insert(roomMembers).values({ roomId: room.id, userId: me, role: "member" });
  res.json(room);
});

/** POST /api/social/rooms/:id/leave */
router.post("/social/rooms/:id/leave", async (req, res) => {
  const me = userId(req);
  if (!me) { res.status(401).json({ error: "x-social-id required" }); return; }
  await db.delete(roomMembers).where(
    and(eq(roomMembers.roomId, req.params.id), eq(roomMembers.userId, me))
  );
  res.json({ ok: true });
});

/** DELETE /api/social/rooms/:id — admin only */
router.delete("/social/rooms/:id", async (req, res) => {
  const me = userId(req);
  if (!me) { res.status(401).json({ error: "x-social-id required" }); return; }
  const [room] = await db.select().from(rooms).where(eq(rooms.id, req.params.id)).limit(1);
  if (!room) { res.status(404).json({ error: "not found" }); return; }
  if (room.adminId !== me) { res.status(403).json({ error: "admin only" }); return; }
  await db.delete(rooms).where(eq(rooms.id, req.params.id));
  res.json({ ok: true });
});

/** GET /api/social/rooms/:id/messages */
router.get("/social/rooms/:id/messages", async (req, res) => {
  const msgs = await db.select().from(roomMessages)
    .where(eq(roomMessages.roomId, req.params.id))
    .orderBy(roomMessages.createdAt)
    .limit(100);
  res.json(msgs);
});

/** PUT /api/social/rooms/:id/members/:memberId — admin/mod only */
router.put("/social/rooms/:id/members/:memberId", async (req, res) => {
  const me = userId(req);
  const { role, muted } = req.body as { role?: "moderator" | "member"; muted?: boolean };
  if (!me) { res.status(401).json({ error: "x-social-id required" }); return; }

  // Check requester is admin/mod
  const [myMembership] = await db.select().from(roomMembers)
    .where(and(eq(roomMembers.roomId, req.params.id), eq(roomMembers.userId, me))).limit(1);
  if (!myMembership || myMembership.role === "member") {
    res.status(403).json({ error: "admin or moderator only" }); return;
  }

  const updates: Partial<{ role: "moderator" | "member"; muted: boolean }> = {};
  if (role !== undefined && myMembership.role === "admin") updates.role = role;
  if (muted !== undefined) updates.muted = muted;

  const [updated] = await db.update(roomMembers)
    .set(updates)
    .where(eq(roomMembers.id, req.params.memberId))
    .returning();
  res.json(updated);
});

/** DELETE /api/social/rooms/:id/members/:userId — kick (admin only) */
router.delete("/social/rooms/:id/members/:targetUserId", async (req, res) => {
  const me = userId(req);
  if (!me) { res.status(401).json({ error: "x-social-id required" }); return; }

  const [myMem] = await db.select().from(roomMembers)
    .where(and(eq(roomMembers.roomId, req.params.id), eq(roomMembers.userId, me))).limit(1);
  if (!myMem || myMem.role === "member") {
    res.status(403).json({ error: "admin or moderator only" }); return;
  }

  await db.delete(roomMembers).where(
    and(eq(roomMembers.roomId, req.params.id), eq(roomMembers.userId, req.params.targetUserId))
  );
  res.json({ ok: true });
});

export default router;
