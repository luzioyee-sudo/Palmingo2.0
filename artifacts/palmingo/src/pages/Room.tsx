import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import {
  Mic, MicOff, LogOut, Copy, Check, Crown, Shield,
  Volume2, VolumeX, Zap, Users, Send, ChevronDown,
} from "lucide-react";
import { BRAND_ORANGE } from "@/lib/theme";
import { wsClient, type OnlineMember, type WsMessage } from "@/lib/ws-client";
import {
  getRoomDetail, getRoomMessages, leaveRoom, getMyId, getMyUsername,
  type RoomDetail,
} from "@/lib/social";

/* ── Avatar ─────────────────────────────────────── */
const COLORS = [
  "oklch(0.65 0.2 250)", "oklch(0.7 0.2 180)",
  "oklch(0.68 0.22 320)", "oklch(0.72 0.2 60)",
  "oklch(0.65 0.22 150)", "oklch(0.7 0.2 30)",
];
function hashIdx(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) & 0xffffff;
  return h % COLORS.length;
}
function UserAvatar({ username, size = 36 }: { username: string; size?: number }) {
  const initials = username.slice(0, 2).toUpperCase();
  const i = hashIdx(username);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, ${COLORS[i]}, ${COLORS[(i + 1) % COLORS.length]})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 700, fontSize: size * 0.36,
      fontFamily: "'Space Grotesk', sans-serif",
    }}>{initials}</div>
  );
}

/* ── Role badge ──────────────────────────────────── */
function RoleBadge({ role }: { role: string }) {
  if (role === "admin")     return <Crown  className="w-3.5 h-3.5" style={{ color: "#F59E0B" }} />;
  if (role === "moderator") return <Shield className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.2 250)" }} />;
  return null;
}

/* ── Speaking indicator ──────────────────────────── */
function SpeakingDot({ active }: { active: boolean }) {
  return (
    <motion.div
      animate={active ? { scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] } : { scale: 1, opacity: 0.3 }}
      transition={{ duration: 0.7, repeat: active ? Infinity : 0 }}
      style={{
        width: 8, height: 8, borderRadius: "50%",
        background: active ? "oklch(0.65 0.22 150)" : "var(--muted-foreground)",
      }}
    />
  );
}

/* ── Message bubble ──────────────────────────────── */
function MsgBubble({ msg, myId }: { msg: WsMessage; myId: string | null }) {
  const isMe = msg.userId === myId;
  const isSystem = msg.type === "system";
  const isChallenge = msg.type === "challenge";

  if (isSystem) {
    return (
      <div style={{ textAlign: "center", padding: "2px 0" }}>
        <span style={{
          fontSize: 12, color: "var(--muted-foreground)",
          background: "var(--secondary)", borderRadius: 99,
          padding: "3px 12px", display: "inline-block",
        }}>{msg.content}</span>
      </div>
    );
  }

  if (isChallenge) {
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{
          background: "linear-gradient(135deg, oklch(0.75 0.18 60 / 0.15), oklch(0.65 0.22 30 / 0.1))",
          border: "1px solid oklch(0.75 0.18 60 / 0.4)",
          borderRadius: 16, padding: "14px 16px", margin: "4px 0",
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: "oklch(0.7 0.2 60)", marginBottom: 6, letterSpacing: "0.05em" }}>
          ⚡ AI CHALLENGE
        </div>
        <div style={{ fontSize: 14, color: "var(--foreground)", lineHeight: 1.5 }}>{msg.content}</div>
      </motion.div>
    );
  }

  return (
    <div style={{
      display: "flex", flexDirection: isMe ? "row-reverse" : "row",
      gap: 8, alignItems: "flex-end",
    }}>
      {!isMe && <UserAvatar username={msg.username ?? "?"} size={28} />}
      <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
        {!isMe && (
          <span style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 3, paddingLeft: 2 }}>
            @{msg.username}
          </span>
        )}
        <div style={{
          background: isMe ? `linear-gradient(135deg, ${BRAND_ORANGE}, #FF6B3D)` : "var(--secondary)",
          color: isMe ? "#fff" : "var(--foreground)",
          borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          padding: "9px 13px", fontSize: 14, lineHeight: 1.45,
          border: isMe ? "none" : "1px solid var(--border)",
        }}>
          {msg.content}
        </div>
        <span style={{ fontSize: 10, color: "var(--muted-foreground)", marginTop: 3, paddingInline: 4 }}>
          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}

/* ── Admin controls dropdown ─────────────────────── */
function MemberControls({
  member, myRole, roomId, myId,
  onClose,
}: {
  member: OnlineMember; myRole: string; roomId: string; myId: string;
  onClose: () => void;
}) {
  const isAdmin = myRole === "admin";
  const isMod   = myRole === "moderator";
  const canControl = isAdmin || isMod;
  if (!canControl || member.userId === myId) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{
        position: "absolute", right: 0, top: 36, zIndex: 50,
        background: "var(--background)", border: "1px solid var(--border)",
        borderRadius: 12, padding: 6, boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        minWidth: 160,
      }}
    >
      <button onClick={() => { wsClient.muteUser(roomId, member.userId, !member.muted); onClose(); }}
        style={{ width: "100%", textAlign: "left", padding: "9px 12px", fontSize: 13, background: "none", border: "none", cursor: "pointer", borderRadius: 8, color: "var(--foreground)", fontFamily: "'Space Grotesk', sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
        {member.muted ? <Volume2 className="w-3.5 h-3.5" style={{ color: BRAND_ORANGE }} /> : <VolumeX className="w-3.5 h-3.5" />}
        {member.muted ? "Unmute" : "Mute"}
      </button>

      {isAdmin && member.role !== "moderator" && (
        <button onClick={() => { wsClient.setRole(roomId, member.userId, "moderator"); onClose(); }}
          style={{ width: "100%", textAlign: "left", padding: "9px 12px", fontSize: 13, background: "none", border: "none", cursor: "pointer", borderRadius: 8, color: "var(--foreground)", fontFamily: "'Space Grotesk', sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
          <Shield className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.2 250)" }} /> Make Moderator
        </button>
      )}
      {isAdmin && member.role === "moderator" && (
        <button onClick={() => { wsClient.setRole(roomId, member.userId, "member"); onClose(); }}
          style={{ width: "100%", textAlign: "left", padding: "9px 12px", fontSize: 13, background: "none", border: "none", cursor: "pointer", borderRadius: 8, color: "var(--foreground)", fontFamily: "'Space Grotesk', sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
          <Shield className="w-3.5 h-3.5" /> Remove Moderator
        </button>
      )}

      <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
      <button onClick={() => { wsClient.kickUser(roomId, member.userId); onClose(); }}
        style={{ width: "100%", textAlign: "left", padding: "9px 12px", fontSize: 13, background: "none", border: "none", cursor: "pointer", borderRadius: 8, color: "oklch(0.6 0.22 25)", fontFamily: "'Space Grotesk', sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
        <LogOut className="w-3.5 h-3.5" /> Kick
      </button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN ROOM PAGE
══════════════════════════════════════════════════ */
export default function Room() {
  const [, params]  = useRoute("/rooms/:id");
  const [, navigate] = useLocation();
  const roomId = params?.id ?? "";
  const myId   = getMyId();
  const myUsername = getMyUsername();

  /* ── state ──────────────────────────────────── */
  const [room, setRoom]       = useState<RoomDetail | null>(null);
  const [messages, setMsgs]   = useState<WsMessage[]>([]);
  const [members, setMembers] = useState<OnlineMember[]>([]);
  const [myRole, setMyRole]   = useState<"admin" | "moderator" | "member">("member");
  const [micOn, setMicOn]     = useState(false);
  const [myMuted, setMyMuted] = useState(false);
  const [chatInput, setInput] = useState("");
  const [copied, setCopied]   = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [wsReady, setWsReady] = useState(false);
  const [targetLang, setTargetLang] = useState("English");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioRefs  = useRef<Map<string, HTMLAudioElement>>(new Map());

  /* ── load room data ──────────────────────────── */
  useEffect(() => {
    if (!roomId) return;
    getRoomDetail(roomId)
      .then(r => { setRoom(r); setTargetLang(r.targetLang); })
      .catch(() => navigate("/rooms"));
    getRoomMessages(roomId)
      .then(msgs => setMsgs(msgs as WsMessage[]))
      .catch(() => {});
  }, [roomId, navigate]);

  /* ── WebSocket setup ─────────────────────────── */
  useEffect(() => {
    if (!myId || !myUsername || !roomId) return;

    // Handle remote audio streams
    wsClient.setOnRemoteStream((peerId, stream) => {
      if (stream) {
        let audio = audioRefs.current.get(peerId);
        if (!audio) {
          audio = new Audio();
          audio.autoplay = true;
          audioRefs.current.set(peerId, audio);
        }
        audio.srcObject = stream;
      } else {
        const audio = audioRefs.current.get(peerId);
        if (audio) { audio.srcObject = null; audioRefs.current.delete(peerId); }
      }
    });

    wsClient.connect();

    const unsub = wsClient.on((ev) => {
      switch (ev.type) {
        case "registered":
          wsClient.joinRoom(roomId);
          break;

        case "room_joined":
          setMembers(ev.members as OnlineMember[]);
          setMyRole(
            (ev.members.find((m: OnlineMember) => m.userId === myId)?.role ?? "member") as "admin" | "moderator" | "member"
          );
          setWsReady(true);
          break;

        case "member_online":
          setMembers(prev => {
            const exists = prev.find(m => m.userId === ev.userId);
            if (exists) return prev.map(m => m.userId === ev.userId ? { ...m, online: true } : m);
            return [...prev, { userId: ev.userId, username: ev.username, name: ev.username, role: ev.role as "admin" | "moderator" | "member", muted: ev.muted, online: true }];
          });
          break;

        case "member_offline":
          setMembers(prev => prev.map(m => m.userId === ev.userId ? { ...m, online: false } : m));
          break;

        case "member_muted":
          setMembers(prev => prev.map(m => m.userId === ev.userId ? { ...m, muted: ev.muted } : m));
          break;

        case "member_kicked":
          setMembers(prev => prev.filter(m => m.userId !== ev.userId));
          break;

        case "role_changed":
          setMembers(prev => prev.map(m => m.userId === ev.userId ? { ...m, role: ev.role as "admin" | "moderator" | "member" } : m));
          if (ev.userId === myId) setMyRole(ev.role as "admin" | "moderator" | "member");
          break;

        case "you_were_muted":
          setMyMuted(ev.muted);
          if (micOn) wsClient.setMicEnabled(!ev.muted);
          break;

        case "you_were_kicked":
          navigate("/rooms");
          break;

        case "new_message":
          setMsgs(prev => [...prev, ev.message]);
          break;

        default: break;
      }
    });

    return () => {
      unsub();
      wsClient.leaveRoom(roomId);
      wsClient.stopAudio();
      for (const audio of audioRefs.current.values()) audio.srcObject = null;
      audioRefs.current.clear();
    };
  }, [myId, myUsername, roomId, navigate, micOn]);

  /* ── auto-scroll chat ────────────────────────── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── actions ─────────────────────────────────── */
  const toggleMic = useCallback(async () => {
    if (myMuted) return; // admin muted us
    if (!micOn) {
      const stream = await wsClient.startAudio();
      if (stream) setMicOn(true);
    } else {
      wsClient.stopAudio();
      setMicOn(false);
    }
  }, [micOn, myMuted]);

  const sendMsg = useCallback(() => {
    if (!chatInput.trim() || !wsReady) return;
    wsClient.sendChat(roomId, chatInput.trim());
    setInput("");
  }, [chatInput, wsReady, roomId]);

  const copyInvite = useCallback(async () => {
    if (!room) return;
    await navigator.clipboard.writeText(room.inviteCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [room]);

  const handleLeave = useCallback(async () => {
    wsClient.leaveRoom(roomId);
    await leaveRoom(roomId).catch(() => {});
    navigate("/rooms");
  }, [roomId, navigate]);

  const sendChallenge = useCallback(() => {
    wsClient.requestChallenge(roomId);
  }, [roomId]);

  /* ── layout helpers ──────────────────────────── */
  const onlineCount  = members.filter(m => m.online).length;
  const canChallenge = myRole === "admin" || myRole === "moderator";
  const isWar        = room?.type === "war";

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: `${BRAND_ORANGE} transparent` }} />
      </div>
    );
  }

  /* ── Members panel ───────────────────────────── */
  const MembersPanel = (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {members.map(m => (
        <div key={m.userId} style={{ position: "relative" }}>
          <div
            onClick={() => setOpenMenu(prev => prev === m.userId ? null : m.userId)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 10px", borderRadius: 12, cursor: "pointer",
              background: m.online ? "rgba(255,77,46,0.06)" : "transparent",
              border: `1px solid ${m.online ? "rgba(255,77,46,0.15)" : "transparent"}`,
              transition: "all 0.15s",
            }}
          >
            <div style={{ position: "relative" }}>
              <UserAvatar username={m.username ?? "?"} size={34} />
              <SpeakingDot active={m.online && !m.muted && micOn && m.userId === myId} />
              {m.online && (
                <div style={{
                  position: "absolute", bottom: 0, right: 0,
                  width: 8, height: 8, borderRadius: "50%",
                  background: "oklch(0.65 0.22 150)",
                  border: "1.5px solid var(--background)",
                }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: "var(--foreground)",
                fontFamily: "'Space Grotesk', sans-serif",
                display: "flex", alignItems: "center", gap: 5,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                <RoleBadge role={m.role} />
                {m.username ?? "?"}
                {m.userId === myId && <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>(you)</span>}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted-foreground)", display: "flex", alignItems: "center", gap: 4 }}>
                {m.muted ? <MicOff className="w-2.5 h-2.5" /> : <Mic className="w-2.5 h-2.5" />}
                {m.muted ? "Muted" : (m.online ? "Online" : "Away")}
              </div>
            </div>
            {canChallenge && m.userId !== myId && (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </div>

          <AnimatePresence>
            {openMenu === m.userId && (
              <MemberControls
                member={m} myRole={myRole} roomId={roomId} myId={myId ?? ""}
                onClose={() => setOpenMenu(null)}
              />
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - 120px)", minHeight: 500 }}>

      {/* ── Room Header ───────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "0 0 16px",
        borderBottom: "1px solid var(--border)", flexWrap: "wrap", rowGap: 8,
      }}>
        <div style={{ fontSize: 24 }}>{isWar ? "⚔️" : "🎙️"}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18,
            color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{room.name}</div>
          <div style={{ fontSize: 12, color: "var(--muted-foreground)", display: "flex", gap: 10 }}>
            <span><Users className="w-3 h-3 inline mr-1" />{onlineCount} online · {members.length} members</span>
            <span>🌍 {room.targetLang}</span>
          </div>
        </div>

        {/* Invite code */}
        <button onClick={copyInvite} style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "var(--secondary)", border: "1px solid var(--border)",
          borderRadius: 10, padding: "7px 12px", cursor: "pointer",
          fontFamily: "monospace", fontWeight: 700, fontSize: 14, letterSpacing: "0.1em",
          color: "var(--foreground)",
        }}>
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" style={{ color: BRAND_ORANGE }} />}
          {room.inviteCode}
        </button>

        <button onClick={handleLeave} style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(255,77,46,0.1)", border: "1px solid rgba(255,77,46,0.3)",
          borderRadius: 10, padding: "7px 14px", cursor: "pointer",
          color: BRAND_ORANGE, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13,
        }}>
          <LogOut className="w-3.5 h-3.5" /> Leave
        </button>
      </div>

      {/* ── Body ─────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", gap: 16, minHeight: 0, marginTop: 16 }}>

        {/* Members sidebar (desktop) */}
        <div className="hidden md:flex" style={{
          width: 220, flexShrink: 0, flexDirection: "column", gap: 8,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "var(--muted-foreground)",
            letterSpacing: "0.08em", textTransform: "uppercase", padding: "0 4px",
          }}>
            Members — {members.length}
          </div>
          <div style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
            {MembersPanel}
          </div>

          {/* Admin challenge button */}
          {canChallenge && (
            <button onClick={sendChallenge} style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              background: "linear-gradient(135deg, oklch(0.75 0.18 60), oklch(0.65 0.22 30))",
              color: "#fff", border: "none", borderRadius: 12, padding: "11px",
              cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13,
            }}>
              <Zap className="w-4 h-4" /> AI Challenge
            </button>
          )}
        </div>

        {/* Chat area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          {/* Mobile: members toggle */}
          <div className="md:hidden mb-3">
            <button onClick={() => setShowMembers(v => !v)} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "var(--secondary)", border: "1px solid var(--border)",
              borderRadius: 10, padding: "7px 12px", cursor: "pointer", fontSize: 13,
              color: "var(--foreground)", fontFamily: "'Space Grotesk', sans-serif",
            }}>
              <Users className="w-3.5 h-3.5" style={{ color: BRAND_ORANGE }} />
              {members.length} members {showMembers ? "▲" : "▼"}
            </button>
            <AnimatePresence>
              {showMembers && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: "hidden", marginTop: 8 }}
                >
                  <div className="glass rounded-2xl p-3">{MembersPanel}</div>
                  {canChallenge && (
                    <button onClick={sendChallenge} style={{
                      width: "100%", marginTop: 8,
                      background: "linear-gradient(135deg, oklch(0.75 0.18 60), oklch(0.65 0.22 30))",
                      color: "#fff", border: "none", borderRadius: 12, padding: "11px",
                      cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}>
                      <Zap className="w-4 h-4" /> AI Challenge
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", display: "flex", flexDirection: "column",
            gap: 8, padding: "4px 2px", minHeight: 0,
          }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", color: "var(--muted-foreground)", fontSize: 13, marginTop: 32 }}>
                No messages yet. Say hello! 👋
              </div>
            )}
            {messages.map(m => (
              <MsgBubble key={m.id} msg={m} myId={myId} />
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input + mic */}
          <div style={{
            display: "flex", gap: 10, marginTop: 12,
            alignItems: "flex-end",
          }}>
            {/* Mic toggle */}
            <button onClick={toggleMic} disabled={myMuted} style={{
              flexShrink: 0, width: 44, height: 44, borderRadius: "50%",
              border: "none", cursor: myMuted ? "not-allowed" : "pointer",
              background: micOn
                ? `linear-gradient(135deg, ${BRAND_ORANGE}, #FF6B3D)`
                : "var(--secondary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: micOn ? "0 4px 14px rgba(255,77,46,0.4)" : "none",
              transition: "all 0.2s", opacity: myMuted ? 0.5 : 1,
            }}>
              {micOn
                ? <Mic className="w-5 h-5 text-white" />
                : <MicOff className="w-5 h-5" style={{ color: myMuted ? "var(--muted-foreground)" : BRAND_ORANGE }} />
              }
            </button>

            {/* Chat input */}
            <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={chatInput}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                placeholder={myMuted ? "You are muted" : "Type a message…"}
                disabled={myMuted}
                style={{
                  flex: 1, background: "var(--secondary)", border: "1px solid var(--border)",
                  borderRadius: 14, padding: "11px 16px", fontSize: 14, outline: "none",
                  color: "var(--foreground)", fontFamily: "'Space Grotesk', sans-serif",
                  opacity: myMuted ? 0.5 : 1,
                }}
              />
              <button onClick={sendMsg} disabled={!chatInput.trim() || !wsReady} style={{
                flexShrink: 0, width: 44, height: 44, borderRadius: "50%",
                border: "none", cursor: !chatInput.trim() ? "not-allowed" : "pointer",
                background: chatInput.trim()
                  ? `linear-gradient(135deg, ${BRAND_ORANGE}, #FF6B3D)`
                  : "var(--secondary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}>
                <Send className={`w-4 h-4 ${chatInput.trim() ? "text-white" : "text-muted-foreground"}`} />
              </button>
            </div>
          </div>

          {/* Status bar */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginTop: 8,
            fontSize: 11, color: "var(--muted-foreground)",
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: wsReady ? "oklch(0.65 0.22 150)" : "oklch(0.6 0.22 25)",
            }} />
            {wsReady ? "Connected" : "Connecting…"}
            {myMuted && (
              <span style={{
                marginLeft: 8, color: "oklch(0.6 0.22 25)", fontWeight: 600,
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <MicOff className="w-3 h-3" /> Muted by admin
              </span>
            )}
            {micOn && !myMuted && (
              <span style={{ marginLeft: 8, color: "oklch(0.65 0.22 150)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                <Mic className="w-3 h-3" /> Mic on
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
