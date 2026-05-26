import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage, Server } from "node:http";
import { db } from "@workspace/db";
import { roomMessages, socialUsers, roomMembers, rooms } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* ── Types ──────────────────────────────────────────── */
interface WsClient {
  ws:       WebSocket;
  userId:   string;
  username: string;
  rooms:    Set<string>;
}

type WsMsg =
  | { type: "register";    userId: string; username: string }
  | { type: "join_room";   roomId: string }
  | { type: "leave_room";  roomId: string }
  | { type: "chat";        roomId: string; content: string }
  | { type: "mute";        roomId: string; targetId: string; muted: boolean }
  | { type: "kick";        roomId: string; targetId: string }
  | { type: "set_role";    roomId: string; targetId: string; role: "moderator" | "member" }
  | { type: "challenge";   roomId: string }
  | { type: "rtc_offer";   roomId: string; toId: string; offer: unknown }
  | { type: "rtc_answer";  roomId: string; toId: string; answer: unknown }
  | { type: "rtc_ice";     roomId: string; toId: string; candidate: unknown };

/* ── State ──────────────────────────────────────────── */
// userId → WsClient
const clients = new Map<string, WsClient>();
// roomId → Set<userId>
const roomOnline = new Map<string, Set<string>>();

/* ── Helpers ────────────────────────────────────────── */
function send(ws: WebSocket, data: object) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function broadcastToRoom(roomId: string, data: object, excludeUserId?: string) {
  const online = roomOnline.get(roomId);
  if (!online) return;
  for (const uid of online) {
    if (uid === excludeUserId) continue;
    const c = clients.get(uid);
    if (c) send(c.ws, data);
  }
}

function getOnlineMembers(roomId: string) {
  const online = roomOnline.get(roomId);
  if (!online) return [];
  return Array.from(online).map(uid => {
    const c = clients.get(uid);
    return c ? { userId: c.userId, username: c.username } : null;
  }).filter(Boolean);
}

async function saveMessage(roomId: string, userId: string | null, username: string, content: string, type: "text" | "system" | "challenge" = "text") {
  try {
    const [msg] = await db.insert(roomMessages).values({
      roomId, userId: userId ?? undefined, username, content, type,
    }).returning();
    return msg;
  } catch { return null; }
}

async function getMembership(roomId: string, userId: string) {
  const [m] = await db.select().from(roomMembers)
    .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId))).limit(1);
  return m ?? null;
}

/* ── AI Challenge ───────────────────────────────────── */
const CHALLENGE_PROMPTS = [
  "Give a vocabulary challenge: ask the group to use a specific word in a sentence in their target language.",
  "Give a grammar challenge: ask them to form a sentence using a specific tense (e.g., past perfect).",
  "Give a pronunciation challenge: describe a tongue twister and ask the group to repeat it.",
  "Give a translation challenge: provide a sentence and ask the group to translate it.",
  "Give a storytelling challenge: give the first sentence of a story in English and ask the group to continue it.",
  "Give a word association challenge: say a category (e.g., 'foods in France') and ask everyone to name items.",
  "Give a roleplay challenge: describe a scenario (e.g., 'you're ordering at a French restaurant') and give each person a role.",
];

async function generateChallenge(targetLang: string): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return "🎯 Challenge: Introduce yourself in your target language in 3 sentences!";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = CHALLENGE_PROMPTS[Math.floor(Math.random() * CHALLENGE_PROMPTS.length)];
    const result = await model.generateContent(
      `You are a language learning facilitator for a group voice room where learners are studying ${targetLang}. ${prompt} Keep your response to 2-3 sentences max, make it fun and engaging. Start directly with the challenge text.`
    );
    return result.response.text().trim();
  } catch {
    return "🎯 Challenge: Each person share one interesting word they learned this week and use it in a sentence!";
  }
}

/* ── Main WS handler ────────────────────────────────── */
export function attachWebSocket(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: "/api/ws" });

  wss.on("connection", (ws: WebSocket, _req: IncomingMessage) => {
    let myClient: WsClient | null = null;

    ws.on("message", async (raw) => {
      let msg: WsMsg;
      try { msg = JSON.parse(raw.toString()) as WsMsg; }
      catch { return; }

      /* ── register ─────────────────────────────────── */
      if (msg.type === "register") {
        myClient = { ws, userId: msg.userId, username: msg.username, rooms: new Set() };
        clients.set(msg.userId, myClient);
        send(ws, { type: "registered", userId: msg.userId });
        return;
      }

      if (!myClient) { send(ws, { type: "error", message: "not registered" }); return; }
      const { userId, username } = myClient;

      /* ── join_room ────────────────────────────────── */
      if (msg.type === "join_room") {
        const { roomId } = msg;

        // Verify membership in DB
        const mem = await getMembership(roomId, userId);
        if (!mem) { send(ws, { type: "error", message: "not a room member" }); return; }

        if (!roomOnline.has(roomId)) roomOnline.set(roomId, new Set());
        roomOnline.get(roomId)!.add(userId);
        myClient.rooms.add(roomId);

        // Tell existing members a new user joined (triggers WebRTC offer)
        broadcastToRoom(roomId, {
          type: "member_online",
          userId, username,
          role: mem.role,
          muted: mem.muted,
          initiateOffer: true,
        }, userId);

        // Send current online members to the joiner
        const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
        const allMembers = await db.select({
          userId: roomMembers.userId, role: roomMembers.role, muted: roomMembers.muted,
          username: socialUsers.username, name: socialUsers.name,
        }).from(roomMembers)
          .leftJoin(socialUsers, eq(roomMembers.userId, socialUsers.id))
          .where(eq(roomMembers.roomId, roomId));

        const online = roomOnline.get(roomId);
        const enriched = allMembers.map(m => ({ ...m, online: online?.has(m.userId) ?? false }));

        send(ws, { type: "room_joined", roomId, members: enriched, targetLang: room?.targetLang ?? "English" });

        // Save system message
        const sysMsg = await saveMessage(roomId, null, "system", `${username} joined the room`, "system");
        if (sysMsg) broadcastToRoom(roomId, { type: "new_message", message: sysMsg }, userId);
        return;
      }

      /* ── leave_room ───────────────────────────────── */
      if (msg.type === "leave_room") {
        const { roomId } = msg;
        roomOnline.get(roomId)?.delete(userId);
        myClient.rooms.delete(roomId);
        broadcastToRoom(roomId, { type: "member_offline", userId });
        const sysMsg = await saveMessage(roomId, null, "system", `${username} left the room`, "system");
        if (sysMsg) broadcastToRoom(roomId, { type: "new_message", message: sysMsg });
        return;
      }

      /* ── chat ─────────────────────────────────────── */
      if (msg.type === "chat") {
        const { roomId, content } = msg;
        if (!myClient.rooms.has(roomId)) return;

        // Check if muted
        const mem = await getMembership(roomId, userId);
        if (mem?.muted) { send(ws, { type: "error", message: "you are muted" }); return; }

        const saved = await saveMessage(roomId, userId, username, content, "text");
        if (saved) broadcastToRoom(roomId, { type: "new_message", message: saved });
        return;
      }

      /* ── mute ─────────────────────────────────────── */
      if (msg.type === "mute") {
        const { roomId, targetId, muted } = msg;
        const myMem = await getMembership(roomId, userId);
        if (!myMem || myMem.role === "member") return;

        await db.update(roomMembers).set({ muted })
          .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, targetId)));

        broadcastToRoom(roomId, { type: "member_muted", userId: targetId, muted });

        // Tell the target directly
        const target = clients.get(targetId);
        if (target) send(target.ws, { type: "you_were_muted", muted });
        return;
      }

      /* ── kick ─────────────────────────────────────── */
      if (msg.type === "kick") {
        const { roomId, targetId } = msg;
        const myMem = await getMembership(roomId, userId);
        if (!myMem || myMem.role === "member") return;

        await db.delete(roomMembers).where(
          and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, targetId))
        );

        roomOnline.get(roomId)?.delete(targetId);
        const target = clients.get(targetId);
        if (target) {
          send(target.ws, { type: "you_were_kicked", roomId });
          target.rooms.delete(roomId);
        }

        broadcastToRoom(roomId, { type: "member_kicked", userId: targetId });
        const kickMsg = await saveMessage(roomId, null, "system",
          `A member was removed from the room.`, "system");
        if (kickMsg) broadcastToRoom(roomId, { type: "new_message", message: kickMsg });
        return;
      }

      /* ── set_role ─────────────────────────────────── */
      if (msg.type === "set_role") {
        const { roomId, targetId, role } = msg;
        const myMem = await getMembership(roomId, userId);
        if (!myMem || myMem.role !== "admin") return;

        await db.update(roomMembers).set({ role })
          .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, targetId)));

        broadcastToRoom(roomId, { type: "role_changed", userId: targetId, role });
        return;
      }

      /* ── challenge ────────────────────────────────── */
      if (msg.type === "challenge") {
        const { roomId } = msg;
        const myMem = await getMembership(roomId, userId);
        if (!myMem || myMem.role === "member") return;

        const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
        const challengeText = await generateChallenge(room?.targetLang ?? "English");

        const saved = await saveMessage(roomId, userId, username, challengeText, "challenge");
        if (saved) broadcastToRoom(roomId, { type: "new_message", message: saved });
        return;
      }

      /* ── WebRTC signaling (relay only) ────────────── */
      if (msg.type === "rtc_offer" || msg.type === "rtc_answer" || msg.type === "rtc_ice") {
        const target = clients.get(msg.toId);
        if (target) {
          send(target.ws, {
            type: msg.type,
            fromId: userId,
            ...(msg.type === "rtc_offer"  ? { offer:     msg.offer }     : {}),
            ...(msg.type === "rtc_answer" ? { answer:    msg.answer }    : {}),
            ...(msg.type === "rtc_ice"    ? { candidate: msg.candidate } : {}),
          });
        }
        return;
      }
    });

    /* ── disconnect ─────────────────────────────────── */
    ws.on("close", async () => {
      if (!myClient) return;
      const { userId, username, rooms: myRooms } = myClient;
      clients.delete(userId);

      for (const roomId of myRooms) {
        roomOnline.get(roomId)?.delete(userId);
        broadcastToRoom(roomId, { type: "member_offline", userId });
      }
    });
  });

  return wss;
}
