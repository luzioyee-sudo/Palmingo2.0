import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { getConversations, getFriends, getMyId, type Conversation, type Friendship } from "@/lib/social";
import { wsClient } from "@/lib/ws-client";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function Avatar({ name }: { name?: string | null }) {
  const s = (name ?? "?").slice(0, 2).toUpperCase();
  return (
    <div className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm text-white flex-shrink-0"
      style={{ background: "linear-gradient(135deg,#ff6b35,#e63000)" }}>
      {s}
    </div>
  );
}

export default function Chats() {
  const [, navigate] = useLocation();
  const myId = getMyId();
  const [convos, setConvos]     = useState<Conversation[]>([]);
  const [friends, setFriends]   = useState<Friendship[]>([]);
  const [loading, setLoading]   = useState(true);
  const [unread, setUnread]     = useState<Record<string, number>>({});

  const load = async () => {
    setLoading(true);
    try {
      const [c, f] = await Promise.all([getConversations(), getFriends()]);
      setConvos(c);
      setFriends(f.filter(fr => fr.status === "accepted"));
      const u: Record<string, number> = {};
      c.forEach(cv => { if (cv.unreadCount > 0) u[cv.friend.id] = cv.unreadCount; });
      setUnread(u);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Listen for new DMs
  const handleWs = useCallback((ev: Parameters<typeof wsClient.on>[0] extends (e: infer E) => void ? E : never) => {
    if (ev.type === "new_dm" && !ev.delivered) {
      const fromId = ev.message.fromId;
      setUnread(prev => ({ ...prev, [fromId]: (prev[fromId] ?? 0) + 1 }));
      setConvos(prev => {
        const idx = prev.findIndex(c => c.friend.id === fromId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], lastMessage: ev.message, unreadCount: (updated[idx].unreadCount ?? 0) + 1 };
          return [updated[idx], ...updated.filter((_, i) => i !== idx)];
        }
        return prev;
      });
    }
  }, []);

  useEffect(() => {
    const off = wsClient.on(handleWs as Parameters<typeof wsClient.on>[0]);
    wsClient.connect();
    return () => off();
  }, [handleWs]);

  // Friends with no conversations yet
  const friendsWithNoConvo = friends.filter(f => {
    const friendId = f.direction === "sent" ? f.addresseeId : f.requesterId;
    return !convos.find(c => c.friend.id === friendId);
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 sticky top-0 z-10"
        style={{ background: "var(--background,white)", borderBottom: "1px solid var(--border,rgba(0,0,0,0.06))" }}>
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Messages</h1>
        <button onClick={() => navigate("/social/search")}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "var(--muted,#f3f4f6)" }}>
          <span style={{ color: "var(--muted-foreground)" }}>🔍</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
          </div>
        ) : convos.length === 0 && friendsWithNoConvo.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 opacity-40">
            <span className="text-5xl">💬</span>
            <p className="font-semibold" style={{ color: "var(--foreground)" }}>No conversations yet</p>
            <p className="text-sm text-center px-8" style={{ color: "var(--muted-foreground)" }}>
              Add friends first, then start chatting!
            </p>
            <button onClick={() => navigate("/social/search")}
              className="mt-2 px-5 py-2 rounded-full text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#ff6b35,#e63000)" }}>
              Find Friends
            </button>
          </div>
        ) : (
          <div>
            {/* Active conversations */}
            {convos.map(c => {
              const unreadCnt = unread[c.friend.id] ?? 0;
              const lastMsg = c.lastMessage;
              return (
                <button
                  key={c.friend.id}
                  onClick={() => { setUnread(p => { const n = { ...p }; delete n[c.friend.id]; return n; }); navigate(`/social/chats/${c.friend.id}`); }}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-black/5 transition-colors text-left focus:outline-none"
                  style={{ borderBottom: "1px solid var(--border,rgba(0,0,0,0.04))" }}
                >
                  <Avatar name={c.friend.name ?? c.friend.username} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                      <p className="font-semibold text-sm truncate" style={{ color: "var(--foreground)" }}>
                        {c.friend.name ?? c.friend.username}
                      </p>
                      {lastMsg && (
                        <span className="text-xs flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>
                          {timeAgo(lastMsg.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm truncate" style={{ color: unreadCnt > 0 ? "var(--foreground)" : "var(--muted-foreground)" }}>
                        {lastMsg?.msgType === "room_share"
                          ? `🎙️ Voice Room: ${lastMsg.roomName ?? "Join Room"}`
                          : (lastMsg?.content ?? `@${c.friend.username}`)}
                      </p>
                      {unreadCnt > 0 && (
                        <span className="flex-shrink-0 text-xs font-bold text-white rounded-full px-2 py-0.5 min-w-[20px] text-center"
                          style={{ background: "#ff6b35" }}>
                          {unreadCnt}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Friends not yet messaged */}
            {friendsWithNoConvo.length > 0 && (
              <div>
                <p className="px-5 py-3 text-xs font-bold uppercase tracking-widest"
                  style={{ color: "var(--muted-foreground)", borderBottom: "1px solid var(--border,rgba(0,0,0,0.06))" }}>
                  Friends
                </p>
                {friendsWithNoConvo.map(f => {
                  const friendId = f.direction === "sent" ? f.addresseeId : f.requesterId;
                  const friend = f.other;
                  return (
                    <button key={f.id} onClick={() => navigate(`/social/chats/${friendId}`)}
                      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-black/5 transition-colors text-left focus:outline-none"
                      style={{ borderBottom: "1px solid var(--border,rgba(0,0,0,0.04))" }}>
                      <Avatar name={friend?.name ?? friend?.username} />
                      <div>
                        <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{friend?.name ?? friend?.username ?? "?"}</p>
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>@{friend?.username} · Tap to message</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
