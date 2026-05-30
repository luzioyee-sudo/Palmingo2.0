import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage, Server } from "node:http";
import { db } from "@workspace/db";
import { roomMessages, socialUsers, roomMembers, rooms, directMessages } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* ── Connected client ──────────────────────────────── */
interface WsClient {
  ws:       WebSocket;
  userId:   string;
  username: string;
  rooms:    Set<string>;
}

/* ── Per-room in-memory state ──────────────────────── */
interface RoomWsState {
  online:     Map<string, { username: string; role: string }>;
  speakers:   Set<string>; // on stage (can mic)
  handRaised: Set<string>; // requesting to speak
}

/* ── Global state ──────────────────────────────────── */
const clients    = new Map<string, WsClient>();            // userId → client
const roomOnline = new Map<string, Set<string>>();         // roomId → Set<userId>
const roomState  = new Map<string, RoomWsState>();         // roomId → state

function getRoomState(roomId: string): RoomWsState {
  if (!roomState.has(roomId)) {
    roomState.set(roomId, { online: new Map(), speakers: new Set(), handRaised: new Set() });
  }
  return roomState.get(roomId)!;
}

/* ── Helpers ───────────────────────────────────────── */
function send(ws: WebSocket, data: object) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
}

function sendTo(userId: string, data: object) {
  const c = clients.get(userId);
  if (c) send(c.ws, data);
}

function broadcastToRoom(roomId: string, data: object, excludeUserId?: string) {
  const online = roomOnline.get(roomId);
  if (!online) return;
  for (const uid of online) {
    if (uid === excludeUserId) continue;
    sendTo(uid, data);
  }
}

function broadcastToAdmins(roomId: string, data: object) {
  const rs = getRoomState(roomId);
  for (const [uid, info] of rs.online) {
    if (info.role === "admin" || info.role === "moderator") sendTo(uid, data);
  }
}

async function getMembership(roomId: string, userId: string) {
  const [m] = await db.select().from(roomMembers)
    .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId))).limit(1);
  return m ?? null;
}

async function saveRoomMsg(roomId: string, userId: string | null, username: string, content: string, type: "text" | "system" | "challenge" = "text") {
  try {
    const [msg] = await db.insert(roomMessages).values({
      roomId, userId: userId ?? undefined, username, content, type,
    }).returning();
    return msg;
  } catch { return null; }
}

/* ── AI Challenge ──────────────────────────────────── */
async function generateChallenge(targetLang: string): Promise<string> {
  const PROMPTS = [
    "Give a vocabulary challenge: ask the group to use a specific word in a sentence in their target language.",
    "Give a grammar challenge: a specific tense they must use (e.g., past perfect).",
    "Give a translation challenge: provide a sentence and ask the group to translate it.",
    "Give a storytelling challenge: give the first sentence in English, group continues.",
    "Give a roleplay challenge: a scenario (e.g., ordering at a restaurant), assign roles.",
  ];
  try {
    if (!process.env.GEMINI_API_KEY) throw new Error("no key");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    const result = await model.generateContent(
      `You are a language learning facilitator for a ${targetLang} voice room. ${prompt} 2-3 sentences max, fun and engaging. Start with the challenge directly.`
    );
    return result.response.text().trim();
  } catch {
    return "🎯 Challenge: Each person share one interesting word they learned this week and use it in a sentence!";
  }
}

/* ── Main ──────────────────────────────────────────── */
export function attachWebSocket(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: "/api/ws" });

  wss.on("connection", (ws: WebSocket, _req: IncomingMessage) => {
    let myClient: WsClient | null = null;

    ws.on("message", async (raw) => {
      let msg: Record<string, unknown>;
      try { msg = JSON.parse(raw.toString()); }
      catch { return; }

      /* ── register ─────────────────────────────────── */
      if (msg.type === "register") {
        myClient = {
          ws, userId: msg.userId as string,
          username: msg.username as string, rooms: new Set(),
        };
        clients.set(msg.userId as string, myClient);
        send(ws, { type: "registered", userId: msg.userId });
        return;
      }

      if (!myClient) { send(ws, { type: "error", message: "not registered" }); return; }
      const { userId, username } = myClient;

      /* ── join_room ────────────────────────────────── */
      if (msg.type === "join_room") {
        const roomId = msg.roomId as string;
        const mem = await getMembership(roomId, userId);
        if (!mem) { send(ws, { type: "error", message: "not a room member" }); return; }

        if (!roomOnline.has(roomId)) roomOnline.set(roomId, new Set());
        roomOnline.get(roomId)!.add(userId);
        myClient.rooms.add(roomId);

        const rs = getRoomState(roomId);
        rs.online.set(userId, { username, role: mem.role });

        // Auto-add admin/mod to speakers
        const isOnStage = mem.role === "admin" || mem.role === "moderator";
        if (isOnStage) rs.speakers.add(userId);

        // Notify existing members
        broadcastToRoom(roomId, {
          type: "member_online", userId, username,
          role: mem.role, muted: mem.muted,
          isOnStage, initiateOffer: true,
        }, userId);

        // Send room state to joiner
        const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
        const allMembers = await db.select({
          userId: roomMembers.userId, role: roomMembers.role, muted: roomMembers.muted,
          username: socialUsers.username, name: socialUsers.name,
        }).from(roomMembers)
          .leftJoin(socialUsers, eq(roomMembers.userId, socialUsers.id))
          .where(eq(roomMembers.roomId, roomId));

        const online = roomOnline.get(roomId)!;
        send(ws, {
          type: "room_joined", roomId,
          members: allMembers.map(m => ({
            ...m, online: online.has(m.userId),
            isOnStage: rs.speakers.has(m.userId),
            hasHandRaised: rs.handRaised.has(m.userId),
          })),
          speakers:   [...rs.speakers],
          handRaised: [...rs.handRaised],
          targetLang: room?.targetLang ?? "English",
        });

        const sysMsg = await saveRoomMsg(roomId, null, "system", `${username} joined the room`, "system");
        if (sysMsg) broadcastToRoom(roomId, { type: "new_message", message: sysMsg }, userId);
        return;
      }

      /* ── leave_room ───────────────────────────────── */
      if (msg.type === "leave_room") {
        const roomId = msg.roomId as string;
        roomOnline.get(roomId)?.delete(userId);
        myClient.rooms.delete(roomId);
        const rs = getRoomState(roomId);
        rs.online.delete(userId);
        rs.speakers.delete(userId);
        rs.handRaised.delete(userId);
        broadcastToRoom(roomId, { type: "member_offline", userId });
        const sysMsg = await saveRoomMsg(roomId, null, "system", `${username} left the room`, "system");
        if (sysMsg) broadcastToRoom(roomId, { type: "new_message", message: sysMsg });
        return;
      }

      /* ── chat ─────────────────────────────────────── */
      if (msg.type === "chat") {
        const { roomId, content } = msg as { roomId: string; content: string };
        if (!myClient.rooms.has(roomId)) return;
        const mem = await getMembership(roomId, userId);
        if (mem?.muted) { send(ws, { type: "error", message: "you are muted" }); return; }
        const saved = await saveRoomMsg(roomId, userId, username, content, "text");
        if (saved) broadcastToRoom(roomId, { type: "new_message", message: saved });
        return;
      }

      /* ── raise_hand ───────────────────────────────── */
      if (msg.type === "raise_hand") {
        const roomId = msg.roomId as string;
        const rs = getRoomState(roomId);
        rs.handRaised.add(userId);
        broadcastToAdmins(roomId, { type: "hand_raised", userId, username });
        broadcastToRoom(roomId, { type: "hand_raised_broadcast", userId });
        return;
      }

      /* ── lower_hand ───────────────────────────────── */
      if (msg.type === "lower_hand") {
        const roomId = msg.roomId as string;
        const rs = getRoomState(roomId);
        rs.handRaised.delete(userId);
        broadcastToRoom(roomId, { type: "hand_lowered", userId });
        return;
      }

      /* ── approve_speaker ──────────────────────────── */
      if (msg.type === "approve_speaker") {
        const { roomId, targetId } = msg as { roomId: string; targetId: string };
        const myMem = await getMembership(roomId, userId);
        if (!myMem || myMem.role === "member") return;
        const rs = getRoomState(roomId);
        rs.speakers.add(targetId);
        rs.handRaised.delete(targetId);
        const targetInfo = rs.online.get(targetId);
        broadcastToRoom(roomId, {
          type: "speaker_added", userId: targetId,
          username: targetInfo?.username ?? "",
        });
        sendTo(targetId, { type: "you_are_on_stage" });
        return;
      }

      /* ── remove_speaker ───────────────────────────── */
      if (msg.type === "remove_speaker") {
        const { roomId, targetId } = msg as { roomId: string; targetId: string };
        const myMem = await getMembership(roomId, userId);
        if (!myMem || myMem.role === "member") return;
        const rs = getRoomState(roomId);
        rs.speakers.delete(targetId);
        broadcastToRoom(roomId, { type: "speaker_removed", userId: targetId });
        sendTo(targetId, { type: "you_are_in_audience" });
        return;
      }

      /* ── step_down ────────────────────────────────── */
      if (msg.type === "step_down") {
        const roomId = msg.roomId as string;
        const rs = getRoomState(roomId);
        rs.speakers.delete(userId);
        broadcastToRoom(roomId, { type: "speaker_removed", userId });
        return;
      }

      /* ── mute ─────────────────────────────────────── */
      if (msg.type === "mute") {
        const { roomId, targetId, muted } = msg as { roomId: string; targetId: string; muted: boolean };
        const myMem = await getMembership(roomId, userId);
        if (!myMem || myMem.role === "member") return;
        await db.update(roomMembers).set({ muted })
          .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, targetId)));
        broadcastToRoom(roomId, { type: "member_muted", userId: targetId, muted });
        sendTo(targetId, { type: "you_were_muted", muted });
        return;
      }

      /* ── kick ─────────────────────────────────────── */
      if (msg.type === "kick") {
        const { roomId, targetId } = msg as { roomId: string; targetId: string };
        const myMem = await getMembership(roomId, userId);
        if (!myMem || myMem.role === "member") return;
        await db.delete(roomMembers).where(
          and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, targetId))
        );
        roomOnline.get(roomId)?.delete(targetId);
        const rs = getRoomState(roomId);
        rs.online.delete(targetId);
        rs.speakers.delete(targetId);
        rs.handRaised.delete(targetId);
        const target = clients.get(targetId);
        if (target) { send(target.ws, { type: "you_were_kicked", roomId }); target.rooms.delete(roomId); }
        broadcastToRoom(roomId, { type: "member_kicked", userId: targetId });
        return;
      }

      /* ── set_role ─────────────────────────────────── */
      if (msg.type === "set_role") {
        const { roomId, targetId, role } = msg as { roomId: string; targetId: string; role: "moderator" | "member" };
        const myMem = await getMembership(roomId, userId);
        if (!myMem || myMem.role !== "admin") return;
        await db.update(roomMembers).set({ role })
          .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, targetId)));
        const rs = getRoomState(roomId);
        const info = rs.online.get(targetId);
        if (info) info.role = role;
        broadcastToRoom(roomId, { type: "role_changed", userId: targetId, role });
        return;
      }

      /* ── challenge ────────────────────────────────── */
      if (msg.type === "challenge") {
        const roomId = msg.roomId as string;
        const myMem = await getMembership(roomId, userId);
        if (!myMem || myMem.role === "member") return;
        const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
        const text = await generateChallenge(room?.targetLang ?? "English");
        const saved = await saveRoomMsg(roomId, userId, username, text, "challenge");
        if (saved) broadcastToRoom(roomId, { type: "new_message", message: saved });
        return;
      }

      /* ── dm (direct message) ──────────────────────── */
      if (msg.type === "dm") {
        const { toId, content, roomId: dmRoomId, roomName, inviteCode } = msg as {
          toId: string; content: string;
          roomId?: string; roomName?: string; inviteCode?: string;
        };
        const msgType = dmRoomId ? "room_share" : "text";
        const [saved] = await db.insert(directMessages).values({
          fromId: userId, toId, content,
          msgType: msgType as "text" | "room_share",
          roomId: dmRoomId, roomName, inviteCode,
        }).returning();
        const payload = { type: "new_dm", message: { ...saved, fromUsername: username } };
        sendTo(toId, payload);
        send(ws, { ...payload, delivered: true });
        return;
      }

      /* ── WebRTC signaling ─────────────────────────── */
      if (msg.type === "rtc_offer" || msg.type === "rtc_answer" || msg.type === "rtc_ice") {
        const target = clients.get(msg.toId as string);
        if (target) {
          send(target.ws, {
            type: msg.type, fromId: userId,
            ...(msg.type === "rtc_offer"  ? { offer:     msg.offer }     : {}),
            ...(msg.type === "rtc_answer" ? { answer:    msg.answer }    : {}),
            ...(msg.type === "rtc_ice"    ? { candidate: msg.candidate } : {}),
          });
        }
        return;
      }
    });

    /* ── disconnect ──────────────────────────────────── */
    ws.on("close", async () => {
      if (!myClient) return;
      const { userId, username, rooms: myRooms } = myClient;
      clients.delete(userId);
      for (const roomId of myRooms) {
        roomOnline.get(roomId)?.delete(userId);
        const rs = getRoomState(roomId);
        rs.online.delete(userId);
        rs.speakers.delete(userId);
        rs.handRaised.delete(userId);
        broadcastToRoom(roomId, { type: "member_offline", userId });
      }
    });
  });

  return wss;
}
