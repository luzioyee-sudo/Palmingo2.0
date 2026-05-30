import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { getMessages, getUser, getMyId, type SocialUser, type DmMessage } from "@/lib/social";
import { wsClient } from "@/lib/ws-client";

function Avatar({ name }: { name?: string | null }) {
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs text-white flex-shrink-0"
      style={{ background: "linear-gradient(135deg,#ff6b35,#e63000)" }}>
      {(name ?? "?").slice(0, 2).toUpperCase()}
    </div>
  );
}

function RoomCard({ msg, onJoin }: { msg: DmMessage; onJoin: () => void }) {
  return (
    <button onClick={onJoin}
      className="flex items-center gap-3 p-3 rounded-2xl text-left focus:outline-none transition-all active:scale-[0.98]"
      style={{ background: "linear-gradient(135deg,#1a0a3e,#0d0820)", border: "1px solid rgba(255,107,53,0.2)", minWidth: 220, maxWidth: 280 }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(255,107,53,0.15)" }}>
        <span className="text-xl">🎙️</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm truncate">{msg.roomName ?? "Voice Room"}</p>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Tap to join</p>
      </div>
      <span className="text-orange-400 text-xs font-semibold">Join →</span>
    </button>
  );
}

function Bubble({ msg, isMe, onJoinRoom }: { msg: DmMessage; isMe: boolean; onJoinRoom: (m: DmMessage) => void }) {
  const time = new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"} items-end mb-2`}>
      {!isMe && <Avatar name={msg.fromUsername} />}

      <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
        {msg.msgType === "room_share" ? (
          <RoomCard msg={msg} onJoin={() => onJoinRoom(msg)} />
        ) : (
          <div style={{
            padding: "10px 14px", borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
            background: isMe ? "linear-gradient(135deg,#ff6b35,#e63000)" : "var(--muted,#f3f4f6)",
            color: isMe ? "white" : "var(--foreground)",
            fontSize: 14, lineHeight: 1.4,
          }}>
            {msg.content}
          </div>
        )}
        <span style={{ color: "var(--muted-foreground,#9ca3af)", fontSize: 10, marginTop: 3, padding: "0 4px" }}>
          {time}
        </span>
      </div>
    </div>
  );
}

export default function DMConversation({ friendId }: { friendId: string }) {
  const [, navigate] = useLocation();
  const myId = getMyId();
  const [friend, setFriend]       = useState<SocialUser | null>(null);
  const [messages, setMessages]   = useState<DmMessage[]>([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [f, msgs] = await Promise.all([getUser(friendId), getMessages(friendId)]);
      setFriend(f);
      setMessages(msgs);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [friendId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Listen for incoming DMs
  const handleWs = useCallback((ev: Parameters<typeof wsClient.on>[0] extends (e: infer E) => void ? E : never) => {
    if (ev.type === "new_dm" && !ev.delivered && ev.message.fromId === friendId) {
      setMessages(prev => [...prev, ev.message]);
    }
    if (ev.type === "new_dm" && ev.delivered && ev.message.toId === friendId) {
      setMessages(prev => {
        const already = prev.find(m => m.id === ev.message.id);
        return already ? prev : [...prev, ev.message];
      });
    }
  }, [friendId]);

  useEffect(() => {
    const off = wsClient.on(handleWs as Parameters<typeof wsClient.on>[0]);
    wsClient.connect();
    return () => off();
  }, [handleWs]);

  const send = async () => {
    if (!input.trim() || sending || !myId) return;
    const content = input.trim();
    setInput(""); setSending(true);
    wsClient.sendDM(friendId, content);
    setSending(false);
  };

  const handleJoinRoom = (msg: DmMessage) => {
    if (msg.roomId) navigate(`/rooms/${msg.roomId}`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 sticky top-0 z-10"
        style={{ background: "var(--background,white)", borderBottom: "1px solid var(--border,rgba(0,0,0,0.06))" }}>
        <button onClick={() => navigate("/social/chats")}
          className="w-8 h-8 flex items-center justify-center rounded-full"
          style={{ background: "var(--muted,#f3f4f6)", border: "none", cursor: "pointer" }}>
          ←
        </button>
        {friend && <Avatar name={friend.name ?? friend.username} />}
        <div className="flex-1">
          <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
            {friend?.name ?? friend?.username ?? "…"}
          </p>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            @{friend?.username} · {friend?.level}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ overflowY: "auto" }}>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-3 opacity-40">
            <span className="text-4xl">👋</span>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Start a conversation!</p>
          </div>
        ) : (
          messages.map(m => (
            <Bubble key={m.id} msg={m} isMe={m.fromId === myId} onJoinRoom={handleJoinRoom} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-3 px-4 py-3"
        style={{ borderTop: "1px solid var(--border,rgba(0,0,0,0.06))", background: "var(--background,white)" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder={`Message ${friend?.name ?? "…"}`}
          className="flex-1 rounded-2xl px-4 py-2.5 text-sm focus:outline-none"
          style={{
            background: "var(--muted,#f3f4f6)", border: "1px solid var(--border,rgba(0,0,0,0.08))",
            color: "var(--foreground)",
          }}
        />
        <button onClick={send} disabled={!input.trim() || sending}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0"
          style={{
            background: input.trim() ? "linear-gradient(135deg,#ff6b35,#e63000)" : "var(--muted,#e5e7eb)",
            border: "none", cursor: input.trim() ? "pointer" : "default",
          }}>
          {sending ? "…" : "➤"}
        </button>
      </div>
    </div>
  );
}
