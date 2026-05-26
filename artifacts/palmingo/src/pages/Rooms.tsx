import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Plus, LogIn, Users, Swords, Globe, Lock, Zap } from "lucide-react";
import { BRAND_ORANGE } from "@/lib/theme";
import {
  getRooms, createRoom, joinRoomByCode, getMyId, getMyUsername,
  type Room,
} from "@/lib/social";
import { wsClient } from "@/lib/ws-client";

/* ── Room card ────────────────────────────────────── */
function RoomCard({ room, onClick }: { room: Room & { memberCount?: number; isMember?: boolean }; onClick: () => void }) {
  const isWar = room.type === "war";
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        width: "100%", textAlign: "left", cursor: "pointer",
        background: "var(--glass)", backdropFilter: "blur(12px)",
        borderRadius: 20, border: "1px solid var(--border)",
        padding: "18px 20px",
        boxShadow: room.isMember ? `0 0 0 1.5px rgba(255,77,46,0.3)` : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        {/* Icon */}
        <div style={{
          width: 48, height: 48, borderRadius: 14, flexShrink: 0,
          background: isWar
            ? "linear-gradient(135deg, oklch(0.68 0.22 320), oklch(0.58 0.25 290))"
            : `linear-gradient(135deg, ${BRAND_ORANGE}, #FF6B3D)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22,
        }}>
          {isWar ? "⚔️" : "🎙️"}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 16, fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif", color: "var(--foreground)",
            }}>{room.name}</span>
            {room.isMember && (
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "2px 8px",
                background: `rgba(255,77,46,0.12)`, color: BRAND_ORANGE,
                borderRadius: 99, border: `1px solid rgba(255,77,46,0.3)`,
              }}>Member</span>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 5, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "var(--muted-foreground)", display: "flex", alignItems: "center", gap: 4 }}>
              <Users className="w-3 h-3" /> {room.memberCount ?? 0} / {room.maxMembers}
            </span>
            <span style={{ fontSize: 12, color: "var(--muted-foreground)", display: "flex", alignItems: "center", gap: 4 }}>
              {room.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {room.isPublic ? "Public" : "Private"}
            </span>
            <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>🌍 {room.targetLang}</span>
            <span style={{
              fontSize: 11, padding: "1px 7px", borderRadius: 99,
              background: isWar ? "oklch(0.68 0.22 320 / 0.15)" : "rgba(255,77,46,0.1)",
              color: isWar ? "oklch(0.68 0.22 320)" : BRAND_ORANGE,
              fontWeight: 600,
            }}>
              {isWar ? "War" : "Voice Room"}
            </span>
          </div>
        </div>

        <div style={{ color: BRAND_ORANGE, opacity: 0.7 }}>
          <LogIn className="w-4 h-4" />
        </div>
      </div>
    </motion.button>
  );
}

/* ── Create modal ─────────────────────────────────── */
function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (room: Room) => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"voice" | "war">("voice");
  const [isPublic, setIsPublic] = useState(false);
  const [targetLang, setTargetLang] = useState("English");
  const [maxMembers, setMaxMembers] = useState(10);
  const [loading, setLoading] = useState(false);

  const langs = ["English", "Arabic", "French", "Spanish", "German", "Italian", "Portuguese"];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const room = await createRoom({ name: name.trim(), type, isPublic, maxMembers, targetLang });
      onCreated(room);
    } catch { } finally { setLoading(false); }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--background)", borderRadius: 24, padding: 28,
          maxWidth: 420, width: "100%", border: "1px solid var(--border)",
        }}
      >
        <h2 className="font-display font-bold text-xl mb-5">Create a Room</h2>
        <form onSubmit={submit} className="space-y-4">
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder="Room name…"
            style={{
              width: "100%", background: "var(--secondary)", border: "1px solid var(--border)",
              borderRadius: 12, padding: "11px 14px", fontSize: 14, outline: "none",
              color: "var(--foreground)", fontFamily: "'Space Grotesk', sans-serif",
            }}
          />

          {/* Type */}
          <div style={{ display: "flex", gap: 8 }}>
            {(["voice", "war"] as const).map(t => (
              <button key={t} type="button" onClick={() => setType(t)} style={{
                flex: 1, padding: "10px 0", borderRadius: 12, cursor: "pointer",
                border: `1.5px solid ${type === t ? BRAND_ORANGE : "var(--border)"}`,
                background: type === t ? `rgba(255,77,46,0.08)` : "var(--secondary)",
                color: type === t ? BRAND_ORANGE : "var(--foreground)",
                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13,
              }}>
                {t === "voice" ? "🎙️ Voice Room" : "⚔️ Learning War"}
              </button>
            ))}
          </div>

          {/* Language */}
          <select value={targetLang} onChange={e => setTargetLang(e.target.value)} style={{
            width: "100%", background: "var(--secondary)", border: "1px solid var(--border)",
            borderRadius: 12, padding: "11px 14px", fontSize: 14, outline: "none",
            color: "var(--foreground)", fontFamily: "'Space Grotesk', sans-serif",
          }}>
            {langs.map(l => <option key={l} value={l}>{l}</option>)}
          </select>

          {/* Max members */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="text-sm text-muted-foreground">Max members: {maxMembers}</span>
            <input type="range" min={2} max={20} value={maxMembers}
              onChange={e => setMaxMembers(Number(e.target.value))}
              style={{ flex: 1, accentColor: BRAND_ORANGE }} />
          </div>

          {/* Public */}
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)}
              style={{ accentColor: BRAND_ORANGE, width: 16, height: 16 }} />
            <span className="text-sm" style={{ color: "var(--foreground)" }}>Public room (visible to all)</span>
          </label>

          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: "12px", borderRadius: 12, cursor: "pointer",
              background: "var(--secondary)", border: "1px solid var(--border)",
              color: "var(--foreground)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500,
            }}>Cancel</button>
            <button type="submit" disabled={!name.trim() || loading} style={{
              flex: 2, padding: "12px", borderRadius: 12, cursor: "pointer",
              background: `linear-gradient(135deg, ${BRAND_ORANGE}, #FF6B3D)`,
              color: "#fff", border: "none",
              fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
              opacity: !name.trim() || loading ? 0.6 : 1,
            }}>
              {loading ? "Creating…" : "Create Room"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────── */
export default function Rooms() {
  const [, navigate] = useLocation();
  const [rooms, setRooms] = useState<(Room & { memberCount?: number; isMember?: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joiningCode, setJoiningCode] = useState(false);
  const [joinError, setJoinError] = useState("");
  const myId = getMyId();

  const load = useCallback(async () => {
    if (!myId) return;
    setLoading(true);
    const r = await getRooms().catch(() => []);
    setRooms(r);
    setLoading(false);
  }, [myId]);

  useEffect(() => { load(); }, [load]);

  // Ensure WS connected
  useEffect(() => {
    const username = getMyUsername();
    if (myId && username) wsClient.connect();
  }, [myId]);

  const joinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setJoiningCode(true); setJoinError("");
    try {
      const room = await joinRoomByCode(joinCode.trim());
      navigate(`/rooms/${room.id}`);
    } catch (err: unknown) {
      const e = err as { status?: number; data?: { error?: string } };
      if (e?.status === 404) setJoinError("Invalid invite code");
      else if (e?.data?.error === "room_full") setJoinError("Room is full");
      else setJoinError("Something went wrong");
    } finally { setJoiningCode(false); }
  };

  const enter = (room: Room) => navigate(`/rooms/${room.id}`);

  if (!myId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-5xl">👥</div>
        <h2 className="font-display font-bold text-2xl">Set up your profile first</h2>
        <button onClick={() => navigate("/friends")} style={{
          background: `linear-gradient(135deg, ${BRAND_ORANGE}, #FF6B3D)`,
          color: "#fff", border: "none", borderRadius: 14, padding: "12px 24px",
          cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
        }}>Go to Friends →</button>
      </div>
    );
  }

  const myRooms = rooms.filter(r => r.isMember);
  const publicRooms = rooms.filter(r => !r.isMember && r.isPublic);

  return (
    <div className="space-y-6">
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={r => { setShowCreate(false); navigate(`/rooms/${r.id}`); }}
        />
      )}

      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Learning Rooms</h1>
          <p className="text-muted-foreground text-sm mt-1">Voice rooms, learning wars, AI challenges.</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{
          flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
          background: `linear-gradient(135deg, ${BRAND_ORANGE}, #FF6B3D)`,
          color: "#fff", border: "none", borderRadius: 14, padding: "10px 18px",
          cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14,
          boxShadow: "0 4px 14px rgba(255,77,46,0.3)",
        }}>
          <Plus className="w-4 h-4" /> New Room
        </button>
      </header>

      {/* Join by code */}
      <form onSubmit={joinByCode} className="glass rounded-3xl p-5">
        <h2 className="font-display font-semibold text-base mb-3 flex items-center gap-2">
          <LogIn className="w-4 h-4" style={{ color: BRAND_ORANGE }} /> Join with Invite Code
        </h2>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
            placeholder="ABC123" maxLength={6}
            style={{
              flex: 1, background: "var(--secondary)", border: `1px solid ${joinError ? "oklch(0.6 0.22 25)" : "var(--border)"}`,
              borderRadius: 12, padding: "11px 16px", fontSize: 16, letterSpacing: "0.12em",
              fontFamily: "monospace", fontWeight: 700, outline: "none", color: "var(--foreground)",
            }}
          />
          <button type="submit" disabled={joinCode.length < 6 || joiningCode} style={{
            background: `linear-gradient(135deg, ${BRAND_ORANGE}, #FF6B3D)`,
            color: "#fff", border: "none", borderRadius: 12, padding: "11px 20px",
            cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
            opacity: joinCode.length < 6 || joiningCode ? 0.6 : 1,
          }}>
            {joiningCode ? "…" : "Join"}
          </button>
        </div>
        {joinError && <p className="text-xs mt-2" style={{ color: "oklch(0.6 0.22 25)" }}>{joinError}</p>}
      </form>

      {/* My rooms */}
      {myRooms.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: BRAND_ORANGE }} /> My Rooms
          </h2>
          <div className="flex flex-col gap-3">
            {myRooms.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <RoomCard room={r} onClick={() => enter(r)} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Public rooms */}
      {publicRooms.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4" style={{ color: BRAND_ORANGE }} /> Public Rooms
          </h2>
          <div className="flex flex-col gap-3">
            {publicRooms.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <RoomCard room={r} onClick={async () => {
                  await joinRoomByCode(r.inviteCode).catch(() => null);
                  enter(r);
                }} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {!loading && myRooms.length === 0 && publicRooms.length === 0 && (
        <div className="glass rounded-3xl p-10 text-center">
          <div className="text-4xl mb-3">🏠</div>
          <div className="font-display font-semibold text-lg mb-2">No rooms yet</div>
          <p className="text-sm text-muted-foreground mb-5">Create your first room or get an invite code from a friend.</p>
          <button onClick={() => setShowCreate(true)} style={{
            background: `linear-gradient(135deg, ${BRAND_ORANGE}, #FF6B3D)`,
            color: "#fff", border: "none", borderRadius: 14, padding: "12px 24px",
            cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
          }}>
            <Plus className="w-4 h-4 inline mr-2" /> Create Room
          </button>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: `${BRAND_ORANGE} transparent` }} />
        </div>
      )}
    </div>
  );
}
