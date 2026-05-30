import { useEffect, useRef, useState, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { wsClient } from "@/lib/ws-client";
import type { WsMessage } from "@/lib/ws-client";
import type { RoomMember } from "@/lib/social";
import { getRoomDetail, getRoomMessages, leaveRoom, getMyId } from "@/lib/social";

/* ── Avatar helpers ──────────────────────────────────── */
function initials(name: string | null, username: string | null) {
  const n = name ?? username ?? "?";
  return n.slice(0, 2).toUpperCase();
}

function SpeakerAvatar({
  member, isSpeaking, hasHandRaised, myId, onPress,
}: {
  member: RoomMember; isSpeaking: boolean; hasHandRaised: boolean;
  myId: string | null; onPress?: (m: RoomMember) => void;
}) {
  const isMe = member.userId === myId;
  return (
    <div className="flex flex-col items-center gap-1.5" style={{ width: 84 }}>
      <button
        onClick={() => onPress?.(member)}
        className="relative focus:outline-none"
        aria-label={member.name ?? member.username ?? "?"}
      >
        {/* Pulse glow ring for speakers */}
        {isSpeaking && (
          <span className="absolute inset-[-6px] rounded-full animate-ping"
            style={{ background: "rgba(255,107,53,0.2)", animationDuration: "1.8s" }} />
        )}
        {/* Avatar */}
        <div
          style={{
            width: 72, height: 72, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 20, color: "white", userSelect: "none",
            background: isSpeaking
              ? "linear-gradient(135deg, #ff6b35 0%, #e63000 100%)"
              : "linear-gradient(135deg, #3b2c80 0%, #251a5e 100%)",
            boxShadow: isSpeaking
              ? "0 0 0 3px #ff6b35, 0 8px 24px rgba(255,107,53,0.45)"
              : "0 0 0 2px rgba(255,255,255,0.07), 0 4px 14px rgba(0,0,0,0.4)",
            transition: "all 0.35s cubic-bezier(.4,0,.2,1)",
            position: "relative",
          }}
        >
          {initials(member.name, member.username)}
          {isMe && (
            <span style={{ position: "absolute", bottom: -4, right: -4, background: "#ff6b35", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, border: "2px solid #0d0828" }}>
              ✓
            </span>
          )}
          {member.role === "admin" && (
            <span style={{ position: "absolute", top: -4, right: -4, fontSize: 14 }}>👑</span>
          )}
          {member.role === "moderator" && !isSpeaking && (
            <span style={{ position: "absolute", top: -4, right: -4, fontSize: 12 }}>🛡️</span>
          )}
        </div>
        {/* Hand raised */}
        {hasHandRaised && (
          <span style={{ position: "absolute", top: -4, left: -4, background: "#ff6b35", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, animation: "bounce 1s infinite" }}>
            ✋
          </span>
        )}
        {/* Muted indicator */}
        {member.muted && (
          <span style={{ position: "absolute", bottom: -4, right: -4, background: "#1a1040", border: "1.5px solid rgba(255,255,255,0.15)", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9 }}>
            🔇
          </span>
        )}
      </button>
      <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, textAlign: "center", maxWidth: 72, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {member.name ?? member.username ?? "?"}
      </span>
    </div>
  );
}

function AudienceAvatar({ member, hasHandRaised, myId, onPress }: {
  member: RoomMember; hasHandRaised: boolean; myId: string | null;
  onPress?: (m: RoomMember) => void;
}) {
  const isMe = member.userId === myId;
  return (
    <div className="flex flex-col items-center gap-1" style={{ width: 54 }}>
      <button onClick={() => onPress?.(member)} className="relative focus:outline-none">
        <div style={{
          width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center",
          justifyContent: "center", fontWeight: 600, fontSize: 13, color: "rgba(255,255,255,0.75)",
          background: "linear-gradient(135deg, #2a1d6e 0%, #1a1045 100%)",
          boxShadow: isMe ? "0 0 0 2px #ff6b35" : "0 0 0 1px rgba(255,255,255,0.06)",
        }}>
          {initials(member.name, member.username)}
        </div>
        {hasHandRaised && (
          <span style={{ position: "absolute", top: -4, right: -4, background: "#ff6b35", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, animation: "bounce 1s infinite" }}>
            ✋
          </span>
        )}
      </button>
      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, textAlign: "center", maxWidth: 48, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {member.username ?? "?"}
      </span>
    </div>
  );
}

/* ── Chat bubble ─────────────────────────────────────── */
function MsgBubble({ msg }: { msg: WsMessage }) {
  if (msg.type === "system") return (
    <div style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 11, padding: "4px 0" }}>
      {msg.content}
    </div>
  );
  if (msg.type === "challenge") return (
    <div style={{ margin: "6px 0", padding: "12px 14px", borderRadius: 16, background: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.25)" }}>
      <div style={{ color: "#ff6b35", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
        ⚡ AI Challenge
      </div>
      <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 1.5, margin: 0 }}>
        {msg.content}
      </p>
    </div>
  );
  return (
    <div style={{ padding: "2px 0" }}>
      <span style={{ color: "#ff9966", fontSize: 11, fontWeight: 600 }}>{msg.username ?? "?"}: </span>
      <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{msg.content}</span>
    </div>
  );
}

/* ── Member action sheet ─────────────────────────────── */
function MemberSheet({ member, myRole, isOnStage, onClose, onApprove, onRemoveStage, onMute, onKick }: {
  member: RoomMember; myRole: string; isOnStage: boolean;
  onClose: () => void;
  onApprove: () => void; onRemoveStage: () => void;
  onMute: () => void; onKick: () => void;
}) {
  const canManage = myRole !== "member";
  return (
    <div className="fixed inset-0 z-[200] flex items-end" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="w-full rounded-t-3xl p-6 space-y-2" style={{ background: "#1a1050" }} onClick={e => e.stopPropagation()}>
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "rgba(255,255,255,0.2)" }} />
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-base"
            style={{ background: "linear-gradient(135deg,#3b2c80,#251a5e)" }}>
            {initials(member.name, member.username)}
          </div>
          <div>
            <div className="text-white font-semibold">{member.name ?? member.username}</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>@{member.username} · {member.role}</div>
          </div>
        </div>
        {canManage && (
          <>
            {!isOnStage ? (
              <button className="w-full py-3.5 rounded-2xl text-sm font-semibold text-left px-5 text-white transition-all"
                style={{ background: "rgba(255,107,53,0.15)", border: "1px solid rgba(255,107,53,0.3)" }}
                onClick={() => { onApprove(); onClose(); }}>
                🎙️ Move to Stage
              </button>
            ) : (
              <button className="w-full py-3.5 rounded-2xl text-sm font-medium text-left px-5"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }}
                onClick={() => { onRemoveStage(); onClose(); }}>
                ⬇️ Move to Audience
              </button>
            )}
            <button className="w-full py-3.5 rounded-2xl text-sm font-medium text-left px-5"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }}
              onClick={() => { onMute(); onClose(); }}>
              {member.muted ? "🔊 Unmute" : "🔇 Mute"}
            </button>
            <button className="w-full py-3.5 rounded-2xl text-sm font-medium text-left px-5"
              style={{ background: "rgba(220,38,38,0.08)", color: "#f87171" }}
              onClick={() => { onKick(); onClose(); }}>
              🚫 Remove from Room
            </button>
          </>
        )}
        <button className="w-full py-3 text-sm text-center" style={{ color: "rgba(255,255,255,0.35)" }} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ── Room page ───────────────────────────────────────── */
export default function Room() {
  const [, params] = useRoute("/rooms/:id");
  const [, navigate] = useLocation();
  const roomId = params?.id ?? "";
  const myId   = getMyId();

  const [roomName, setRoomName]       = useState("Voice Room");
  const [targetLang, setTargetLang]   = useState("English");
  const [myRole, setMyRole]           = useState<"admin" | "moderator" | "member">("member");
  const [members, setMembers]         = useState<RoomMember[]>([]);
  const [speakers, setSpeakers]       = useState<Set<string>>(new Set());
  const [handRaised, setHandRaised]   = useState<Set<string>>(new Set());
  const [isOnStage, setIsOnStage]     = useState(false);
  const [myHandRaised, setMyHandRaised] = useState(false);
  const [micOn, setMicOn]             = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);
  const [messages, setMessages]       = useState<WsMessage[]>([]);
  const [chatInput, setChatInput]     = useState("");
  const [selected, setSelected]       = useState<RoomMember | null>(null);
  const [handReqs, setHandReqs]       = useState<{ userId: string; username: string }[]>([]);
  const [loading, setLoading]         = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  // Load room
  useEffect(() => {
    if (!roomId) return;
    setLoading(false);
    getRoomDetail(roomId).then(r => { setRoomName(r.name); setTargetLang(r.targetLang); }).catch(() => {});
    getRoomMessages(roomId).then(msgs => setMessages(msgs as unknown as WsMessage[])).catch(() => {});
  }, [roomId]);

  // WS handler
  const handleEvent = useCallback((ev: Parameters<typeof wsClient.on>[0] extends (e: infer E) => void ? E : never) => {
    if (ev.type === "room_joined") {
      setMembers(ev.members as RoomMember[]);
      setSpeakers(new Set(ev.speakers));
      setHandRaised(new Set(ev.handRaised));
      setTargetLang(ev.targetLang);
      const me = ev.members.find((m: RoomMember) => m.userId === myId);
      if (me) { setMyRole(me.role); setIsOnStage(!!me.isOnStage); }
      return;
    }
    if (ev.type === "member_online") {
      setMembers(prev => {
        const idx = prev.findIndex(m => m.userId === ev.userId);
        const next: RoomMember = { userId: ev.userId, username: ev.username, name: ev.username, role: ev.role as "admin"|"moderator"|"member", muted: ev.muted, online: true, isOnStage: ev.isOnStage, hasHandRaised: false };
        return idx >= 0 ? prev.map((m, i) => i === idx ? { ...m, online: true } : m) : [...prev, next];
      });
      if (ev.isOnStage) setSpeakers(p => { const n = new Set(p); n.add(ev.userId); return n; });
      return;
    }
    if (ev.type === "member_offline")   { setMembers(p => p.map(m => m.userId === ev.userId ? { ...m, online: false } : m)); return; }
    if (ev.type === "member_muted")     { setMembers(p => p.map(m => m.userId === ev.userId ? { ...m, muted: ev.muted } : m)); return; }
    if (ev.type === "member_kicked")    { setMembers(p => p.filter(m => m.userId !== ev.userId)); return; }
    if (ev.type === "you_were_kicked")  { navigate("/social/rooms"); return; }
    if (ev.type === "you_are_on_stage") { setIsOnStage(true); setMyHandRaised(false); return; }
    if (ev.type === "you_are_in_audience") { setIsOnStage(false); setMicOn(false); wsClient.setMicEnabled(false); return; }
    if (ev.type === "hand_raised") {
      if (myRole !== "member") setHandReqs(p => [...p.filter(r => r.userId !== ev.userId), { userId: ev.userId, username: ev.username }]);
      setHandRaised(p => { const n = new Set(p); n.add(ev.userId); return n; });
      return;
    }
    if (ev.type === "hand_raised_broadcast") { setHandRaised(p => { const n = new Set(p); n.add(ev.userId); return n; }); return; }
    if (ev.type === "hand_lowered") { setHandRaised(p => { const n = new Set(p); n.delete(ev.userId); return n; }); setHandReqs(p => p.filter(r => r.userId !== ev.userId)); return; }
    if (ev.type === "speaker_added") { setSpeakers(p => { const n = new Set(p); n.add(ev.userId); return n; }); setHandRaised(p => { const n = new Set(p); n.delete(ev.userId); return n; }); setHandReqs(p => p.filter(r => r.userId !== ev.userId)); return; }
    if (ev.type === "speaker_removed") { setSpeakers(p => { const n = new Set(p); n.delete(ev.userId); return n; }); return; }
    if (ev.type === "new_message") { setMessages(p => [...p, ev.message]); return; }
  }, [myId, myRole, navigate]);

  useEffect(() => {
    if (!roomId) return;
    const off = wsClient.on(handleEvent as Parameters<typeof wsClient.on>[0]);
    wsClient.connect();
    wsClient.joinRoom(roomId);
    return () => { off(); wsClient.leaveRoom(roomId); wsClient.stopAudio(); };
  }, [roomId, handleEvent]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Actions
  const toggleMic = async () => {
    if (!isOnStage) return;
    if (!audioStarted) {
      const stream = await wsClient.startAudio();
      if (!stream) return;
      setAudioStarted(true); setMicOn(true);
    } else {
      const next = !micOn; setMicOn(next); wsClient.setMicEnabled(next);
    }
  };
  const handleRaiseHand = () => {
    if (myHandRaised) { wsClient.lowerHand(roomId); setMyHandRaised(false); }
    else              { wsClient.raiseHand(roomId);  setMyHandRaised(true); }
  };
  const handleStepDown = () => { wsClient.stepDown(roomId); setMicOn(false); wsClient.setMicEnabled(false); };
  const sendChat = () => { if (!chatInput.trim()) return; wsClient.sendChat(roomId, chatInput.trim()); setChatInput(""); };
  const handleLeave = async () => { await leaveRoom(roomId).catch(() => {}); navigate("/social/rooms"); };

  const stageMembers    = members.filter(m => speakers.has(m.userId));
  const audienceMembers = members.filter(m => !speakers.has(m.userId));
  const isAdminOrMod    = myRole !== "member";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", flexDirection: "column", overflow: "hidden",
      background: "linear-gradient(160deg, #100a2e 0%, #0c0720 50%, #12083a 100%)",
    }}>
      {/* ── Header ──────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px 12px",
        background: "rgba(0,0,0,0.25)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <button onClick={handleLeave} style={{
          width: 34, height: 34, borderRadius: "50%", border: "none", cursor: "pointer",
          background: "rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
        }}>✕</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "white", fontWeight: 600, fontSize: 15 }}>{roomName}</div>
          <div style={{ color: "rgba(255,107,53,0.7)", fontSize: 11 }}>
            {targetLang} · {members.length} members
          </div>
        </div>
        <div style={{ width: 34, height: 34 }} />
      </div>

      {/* ── Scrollable content ───────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 140 }}>

        {/* Stage */}
        <div style={{ padding: "20px 16px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <span style={{ color: "#ff6b35", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em" }}>
              🎙 On Stage
            </span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,107,53,0.18)" }} />
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 10 }}>{stageMembers.length}</span>
          </div>

          {stageMembers.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 0", opacity: 0.35 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎙️</div>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0 }}>No speakers on stage yet</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
              {stageMembers.map(m => (
                <SpeakerAvatar key={m.userId} member={m}
                  isSpeaking={speakers.has(m.userId)} hasHandRaised={handRaised.has(m.userId)}
                  myId={myId} onPress={isAdminOrMod ? setSelected : undefined}
                />
              ))}
            </div>
          )}
        </div>

        {/* Audience */}
        {audienceMembers.length > 0 && (
          <div style={{ padding: "16px 16px 4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                👥 Audience
              </span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
              <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 10 }}>{audienceMembers.length}</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {audienceMembers.slice(0, 20).map(m => (
                <AudienceAvatar key={m.userId} member={m} hasHandRaised={handRaised.has(m.userId)}
                  myId={myId} onPress={isAdminOrMod ? setSelected : undefined}
                />
              ))}
              {audienceMembers.length > 20 && (
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
                  +{audienceMembers.length - 20}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admin: hand requests */}
        {isAdminOrMod && handReqs.length > 0 && (
          <div style={{ margin: "16px", padding: "14px 16px", borderRadius: 18, background: "rgba(255,107,53,0.07)", border: "1px solid rgba(255,107,53,0.18)" }}>
            <p style={{ color: "#ff9966", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, marginTop: 0 }}>
              ✋ Raise Hand Requests
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {handReqs.map(r => (
                <div key={r.userId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>@{r.username}</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => wsClient.approveSpeaker(roomId, r.userId)} style={{ padding: "5px 14px", borderRadius: 20, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#ff6b35,#e63000)", color: "white", fontSize: 12, fontWeight: 600 }}>
                      ✓ Let Speak
                    </button>
                    <button onClick={() => { wsClient.lowerHand(roomId); setHandReqs(p => p.filter(x => x.userId !== r.userId)); }} style={{ padding: "5px 12px", borderRadius: 20, border: "none", cursor: "pointer", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat messages */}
        <div style={{ padding: "12px 16px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              💬 Chat
            </span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.04)" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {messages.slice(-40).map(m => <MsgBubble key={m.id} msg={m} />)}
            <div ref={chatEndRef} />
          </div>
        </div>
      </div>

      {/* ── Floating action bar ──────────────────────── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "10px 16px 28px",
        background: "linear-gradient(to top, rgba(10,6,28,0.98) 70%, transparent)",
        backdropFilter: "blur(12px)",
      }}>
        {/* Chat input */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <input
            ref={inputRef}
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendChat()}
            placeholder="Say something…"
            style={{
              flex: 1, borderRadius: 24, padding: "10px 16px",
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
              color: "white", fontSize: 13, outline: "none",
            }}
          />
          <button onClick={sendChat} disabled={!chatInput.trim()}
            style={{
              width: 38, height: 38, borderRadius: "50%", border: "none", cursor: "pointer",
              background: chatInput.trim() ? "linear-gradient(135deg,#ff6b35,#e63000)" : "rgba(255,255,255,0.07)",
              color: "white", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
            }}>➤</button>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around" }}>
          {!isOnStage ? (
            /* Audience: Raise hand */
            <ActionBtn
              emoji={myHandRaised ? "✋" : "🙋"}
              label={myHandRaised ? "Lower Hand" : "Request Speak"}
              active={myHandRaised}
              onClick={handleRaiseHand}
            />
          ) : (
            <>
              <ActionBtn emoji={micOn ? "🎙️" : "🔇"} label={micOn ? "Mic On" : "Mic Off"} active={micOn} onClick={toggleMic} />
              <ActionBtn emoji="⬇️" label="Step Down" onClick={handleStepDown} />
            </>
          )}
          {isAdminOrMod && (
            <ActionBtn emoji="⚡" label="Challenge" onClick={() => wsClient.requestChallenge(roomId)} />
          )}
          <ActionBtn emoji="🚪" label="Leave" danger onClick={handleLeave} />
        </div>
      </div>

      {/* Member sheet */}
      {selected && (
        <MemberSheet
          member={selected} myRole={myRole} isOnStage={speakers.has(selected.userId)}
          onClose={() => setSelected(null)}
          onApprove={() => wsClient.approveSpeaker(roomId, selected.userId)}
          onRemoveStage={() => wsClient.removeSpeaker(roomId, selected.userId)}
          onMute={() => wsClient.muteUser(roomId, selected.userId, !selected.muted)}
          onKick={() => { wsClient.kickUser(roomId, selected.userId); setSelected(null); }}
        />
      )}
    </div>
  );
}

function ActionBtn({ emoji, label, active, danger, onClick }: { emoji: string; label: string; active?: boolean; danger?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      padding: "8px 12px", borderRadius: 16, border: "none", cursor: "pointer",
      background: danger ? "rgba(220,38,38,0.1)" : active ? "rgba(255,107,53,0.18)" : "rgba(255,255,255,0.07)",
      outline: "none", transition: "all 0.2s",
    }}>
      <span style={{ fontSize: 20 }}>{emoji}</span>
      <span style={{
        fontSize: 10, color: danger ? "#f87171" : active ? "#ff6b35" : "rgba(255,255,255,0.4)",
        whiteSpace: "nowrap",
      }}>{label}</span>
    </button>
  );
}
