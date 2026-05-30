import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  getRooms, createRoom, joinRoomByCode, getMyId,
  type Room,
} from "@/lib/social";

function RoomCard({ room, onJoin, isLive }: { room: Room; onJoin: (r: Room) => void; isLive?: boolean }) {
  return (
    <button
      onClick={() => onJoin(room)}
      className="w-full text-left rounded-2xl p-4 transition-all active:scale-[0.98] focus:outline-none"
      style={{
        background: isLive
          ? "linear-gradient(135deg, #1a0a3e 0%, #120826 100%)"
          : "var(--card,white)",
        border: isLive
          ? "1px solid rgba(255,107,53,0.25)"
          : "1px solid var(--border,rgba(0,0,0,0.06))",
        boxShadow: isLive
          ? "0 4px 20px rgba(255,107,53,0.08)"
          : "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Icon */}
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: isLive ? "rgba(255,107,53,0.15)" : "var(--muted,#f3f4f6)" }}>
          <span className="text-xl">{room.type === "war" ? "⚔️" : "🎙️"}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-sm truncate" style={{ color: isLive ? "white" : "var(--foreground)" }}>
              {room.name}
            </p>
            {isLive && (
              <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,107,53,0.2)", color: "#ff6b35" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse inline-block" />
                LIVE
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: isLive ? "rgba(255,255,255,0.4)" : "var(--muted-foreground)" }}>
            {room.targetLang} · {room.type === "war" ? "Learning War" : "Voice Room"}
            {" · "}{room.memberCount ?? 0} members
          </p>
        </div>

        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: isLive ? "rgba(255,107,53,0.2)" : "var(--muted,#f3f4f6)" }}>
            <span className="text-xs" style={{ color: isLive ? "#ff6b35" : "var(--muted-foreground)" }}>→</span>
          </div>
        </div>
      </div>
    </button>
  );
}

/* ── Create Room Modal ─────────────────────────────── */
function CreateRoomModal({ onClose, onCreated }: { onClose: () => void; onCreated: (r: Room) => void }) {
  const [name, setName]         = useState("");
  const [type, setType]         = useState<"voice" | "war">("voice");
  const [isPublic, setIsPublic] = useState(true);
  const [lang, setLang]         = useState("English");
  const [loading, setLoading]   = useState(false);

  const LANGS = ["English", "Arabic", "French", "Spanish", "German", "Japanese", "Chinese"];

  const submit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const room = await createRoom({ name: name.trim(), type, isPublic, maxMembers: 12, targetLang: lang });
      onCreated(room);
      onClose();
    } catch { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-6 space-y-4"
        style={{ background: "var(--background,white)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Create a Room</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "var(--muted,#f3f4f6)" }}>✕</button>
        </div>

        <input value={name} onChange={e => setName(e.target.value)}
          placeholder="What will you talk about?"
          className="w-full rounded-2xl px-4 py-3 text-sm focus:outline-none"
          style={{ background: "var(--muted,#f9fafb)", border: "1px solid var(--border,rgba(0,0,0,0.08))", color: "var(--foreground)" }}
        />

        {/* Type */}
        <div>
          <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>Mode</p>
          <div className="grid grid-cols-2 gap-2">
            {(["voice", "war"] as const).map(t => (
              <button key={t} onClick={() => setType(t)}
                className="py-3 rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                style={{
                  background: type === t ? "linear-gradient(135deg,#ff6b35,#e63000)" : "var(--muted,#f3f4f6)",
                  color: type === t ? "white" : "var(--muted-foreground,#6b7280)",
                }}>
                <span>{t === "voice" ? "💬" : "⚔️"}</span>
                <span>{t === "voice" ? "Chat" : "War"}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div>
          <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>Language</p>
          <div className="flex flex-wrap gap-2">
            {LANGS.map(l => (
              <button key={l} onClick={() => setLang(l)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  background: lang === l ? "linear-gradient(135deg,#ff6b35,#e63000)" : "var(--muted,#f3f4f6)",
                  color: lang === l ? "white" : "var(--muted-foreground)",
                }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Public toggle */}
        <div className="flex items-center justify-between py-2"
          style={{ borderTop: "1px solid var(--border,rgba(0,0,0,0.06))" }}>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Public Room</p>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Anyone can discover and join</p>
          </div>
          <button onClick={() => setIsPublic(!isPublic)}
            className="relative w-12 h-7 rounded-full transition-all duration-200"
            style={{ background: isPublic ? "#ff6b35" : "var(--muted,#d1d5db)" }}>
            <div className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all duration-200"
              style={{ left: isPublic ? "calc(100% - 1.625rem)" : "0.125rem" }} />
          </button>
        </div>

        <button onClick={submit} disabled={!name.trim() || loading}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white"
          style={{ background: name.trim() ? "linear-gradient(135deg,#ff6b35,#e63000)" : "var(--muted,#e5e7eb)" }}>
          {loading ? "Creating…" : "Start Voice Room"}
        </button>
      </div>
    </div>
  );
}

/* ── Join by Code Modal ────────────────────────────── */
function JoinCodeModal({ onClose, onJoined }: { onClose: () => void; onJoined: (r: Room) => void }) {
  const [code, setCode]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!code.trim()) return;
    setLoading(true); setError("");
    try {
      const room = await joinRoomByCode(code.trim().toUpperCase());
      onJoined(room);
      onClose();
    } catch (e: unknown) {
      setError((e as Error).message ?? "Invalid code");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6 space-y-4"
        style={{ background: "var(--background,white)" }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Join with Code</h2>
        <input value={code} onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="Enter invite code"
          className="w-full rounded-2xl px-4 py-3 text-center text-xl font-mono font-bold uppercase tracking-widest focus:outline-none"
          style={{ background: "var(--muted,#f9fafb)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          maxLength={8}
        />
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <button onClick={submit} disabled={!code.trim() || loading}
          className="w-full py-3 rounded-2xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#ff6b35,#e63000)" }}>
          {loading ? "Joining…" : "Join Room"}
        </button>
      </div>
    </div>
  );
}

/* ── VoiceRooms page ───────────────────────────────── */
export default function VoiceRooms() {
  const [, navigate] = useLocation();
  const myId = getMyId();
  const [rooms, setRooms]       = useState<Room[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setRooms(await getRooms()); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleJoin = async (room: Room) => {
    try {
      await joinRoomByCode(room.inviteCode).catch(() => {});
      navigate(`/rooms/${room.id}`);
    } catch { navigate(`/rooms/${room.id}`); }
  };

  const myRooms    = rooms.filter(r => r.adminId === myId);
  const memberRooms = rooms.filter(r => r.adminId !== myId && r.isMember);
  const publicRooms = rooms.filter(r => r.isPublic && r.adminId !== myId && !r.isMember);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 sticky top-0 z-10"
        style={{ background: "var(--background,white)", borderBottom: "1px solid var(--border,rgba(0,0,0,0.06))" }}>
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Voice Rooms</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowJoin(true)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: "var(--muted,#f3f4f6)", color: "var(--foreground)" }}>
            # Code
          </button>
          <button onClick={() => setShowCreate(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-lg"
            style={{ background: "linear-gradient(135deg,#ff6b35,#e63000)" }}>
            +
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="px-4 py-4 space-y-6">
            {/* My rooms */}
            {myRooms.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: "var(--muted-foreground)" }}>My Rooms</h2>
                <div className="space-y-2">
                  {myRooms.map(r => <RoomCard key={r.id} room={r} onJoin={handleJoin} />)}
                </div>
              </section>
            )}

            {/* Joined rooms */}
            {memberRooms.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: "var(--muted-foreground)" }}>Joined Rooms</h2>
                <div className="space-y-2">
                  {memberRooms.map(r => <RoomCard key={r.id} room={r} onJoin={handleJoin} isLive />)}
                </div>
              </section>
            )}

            {/* Public rooms */}
            {publicRooms.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: "var(--muted-foreground)" }}>Discover Rooms</h2>
                <div className="space-y-2">
                  {publicRooms.map(r => <RoomCard key={r.id} room={r} onJoin={handleJoin} />)}
                </div>
              </section>
            )}

            {rooms.length === 0 && (
              <div className="flex flex-col items-center py-16 gap-3 opacity-50">
                <span className="text-5xl">🎙️</span>
                <p className="font-semibold" style={{ color: "var(--foreground)" }}>No rooms yet</p>
                <p className="text-sm text-center" style={{ color: "var(--muted-foreground)" }}>
                  Create one or join with an invite code
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateRoomModal
          onClose={() => setShowCreate(false)}
          onCreated={(r) => { setRooms(prev => [r, ...prev]); navigate(`/rooms/${r.id}`); }}
        />
      )}
      {showJoin && (
        <JoinCodeModal
          onClose={() => setShowJoin(false)}
          onJoined={(r) => navigate(`/rooms/${r.id}`)}
        />
      )}
    </div>
  );
}
