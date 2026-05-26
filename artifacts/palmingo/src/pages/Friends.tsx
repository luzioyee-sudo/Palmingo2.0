import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Search, UserPlus, Check, X, UserMinus, Users, Clock, Swords } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getProgress } from "@/lib/progress";
import {
  getMyId, getMyUsername, registerUser,
  searchUsers, getFriends, sendFriendRequest,
  respondToFriend, removeFriend,
  type SocialUser, type Friendship,
} from "@/lib/social";
import { wsClient } from "@/lib/ws-client";
import { BRAND_ORANGE } from "@/lib/theme";

/* ── Avatar ──────────────────────────────────────── */
const COLORS = [
  "oklch(0.65 0.2 250)", "oklch(0.7 0.2 180)",
  "oklch(0.68 0.22 320)", "oklch(0.72 0.2 60)",
  "oklch(0.65 0.22 150)", "oklch(0.7 0.2 30)",
];
function hashColor(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) & 0xffffff;
  return COLORS[h % COLORS.length];
}
function UserAvatar({ username, name, size = 40 }: { username: string; name?: string; size?: number }) {
  const initials = (name ?? username).split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const col = hashColor(username);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${col}, ${COLORS[(COLORS.indexOf(col) + 1) % COLORS.length]})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 700, fontSize: size * 0.36,
      fontFamily: "'Space Grotesk', sans-serif", flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

/* ── Register modal ───────────────────────────────── */
function RegisterModal({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const progress = getProgress();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = username.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (slug.length < 3) { setError("At least 3 characters (letters, numbers, _)"); return; }

    setLoading(true);
    setError("");
    try {
      const id = crypto.randomUUID();
      await registerUser({
        id, username: slug,
        name: user?.name ?? username,
        xp: progress.xp, streak: progress.streak, level: progress.level,
      });
      wsClient.connect();
      onDone();
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } };
      if (e?.data?.error === "username_taken") setError("Username already taken, try another");
      else setError("Something went wrong");
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{
          background: "var(--background)", borderRadius: 24,
          padding: 32, maxWidth: 400, width: "100%",
          border: "1px solid var(--border)", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <div className="text-4xl text-center mb-2">👥</div>
        <h2 className="font-display font-bold text-2xl text-center mb-1">Choose your username</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Your unique handle so friends can find you.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "var(--secondary)", borderRadius: 12,
              border: `1.5px solid ${error ? "oklch(0.6 0.22 25)" : "var(--border)"}`,
              padding: "0 14px", overflow: "hidden",
            }}>
              <span className="text-muted-foreground text-sm font-mono">@</span>
              <input
                value={username}
                onChange={e => { setUsername(e.target.value); setError(""); }}
                placeholder="your_username"
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  padding: "12px 0", fontSize: 16, fontFamily: "'Space Grotesk', sans-serif",
                  color: "var(--foreground)",
                }}
              />
            </div>
            {error && <p className="text-xs mt-1.5" style={{ color: "oklch(0.6 0.22 25)" }}>{error}</p>}
          </div>
          <button
            type="submit"
            disabled={loading || username.length < 3}
            style={{
              width: "100%",
              background: `linear-gradient(135deg, ${BRAND_ORANGE}, #FF6B3D)`,
              color: "#fff", border: "none", borderRadius: 12,
              padding: "13px", cursor: "pointer",
              fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15,
              opacity: loading || username.length < 3 ? 0.6 : 1,
              transition: "all 0.2s",
            }}
          >
            {loading ? "Setting up…" : "Get Started →"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────── */
export default function Friends() {
  const [, navigate] = useLocation();
  const [registered, setRegistered] = useState(() => !!getMyId());
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<SocialUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [pending, setPending] = useState<Friendship[]>([]);
  const [sent, setSent] = useState<Friendship[]>([]);
  const [accepted, setAccepted] = useState<Friendship[]>([]);
  const myId = getMyId();
  const myUsername = getMyUsername();

  const loadFriends = useCallback(async () => {
    if (!myId) return;
    const all = await getFriends().catch(() => []);
    setFriends(all);
    setPending(all.filter(f => f.status === "pending" && f.direction === "received"));
    setSent(all.filter(f => f.status === "pending" && f.direction === "sent"));
    setAccepted(all.filter(f => f.status === "accepted"));
  }, [myId]);

  useEffect(() => { if (registered) loadFriends(); }, [registered, loadFriends]);

  const doSearch = useCallback(async () => {
    if (!searchQ.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const r = await searchUsers(searchQ);
      // Filter out existing friends
      const friendIds = new Set(friends.map(f => f.requesterId === myId ? f.addresseeId : f.requesterId));
      setSearchResults(r.filter(u => !friendIds.has(u.id)));
    } catch {} finally { setSearching(false); }
  }, [searchQ, friends, myId]);

  useEffect(() => {
    const t = setTimeout(doSearch, 400);
    return () => clearTimeout(t);
  }, [doSearch]);

  const addFriend = async (addresseeId: string) => {
    await sendFriendRequest(addresseeId).catch(() => null);
    setSearchResults(r => r.filter(u => u.id !== addresseeId));
    await loadFriends();
  };

  const respond = async (fid: string, accept: boolean) => {
    await respondToFriend(fid, accept);
    await loadFriends();
  };

  const remove = async (fid: string) => {
    await removeFriend(fid);
    await loadFriends();
  };

  if (!registered) {
    return <RegisterModal onDone={() => setRegistered(true)} />;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold">Friends</h1>
        <p className="text-muted-foreground text-sm mt-1">
          @{myUsername} · Search, connect, and learn together.
        </p>
      </header>

      {/* Quick actions */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => navigate("/rooms")}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: `linear-gradient(135deg, ${BRAND_ORANGE}, #FF6B3D)`,
            color: "#fff", border: "none", borderRadius: 14,
            padding: "10px 18px", cursor: "pointer",
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14,
            boxShadow: "0 4px 14px rgba(255,77,46,0.3)",
          }}
        >
          <Users className="w-4 h-4" /> Learning Rooms
        </button>
        <button
          onClick={() => navigate("/rooms?type=war")}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "var(--secondary)", border: "1px solid var(--border)",
            borderRadius: 14, padding: "10px 18px", cursor: "pointer",
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500, fontSize: 14,
            color: "var(--foreground)",
          }}
        >
          <Swords className="w-4 h-4" style={{ color: BRAND_ORANGE }} /> Learning Wars
        </button>
      </div>

      {/* Search */}
      <div className="glass rounded-3xl p-5">
        <h2 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
          <Search className="w-4 h-4" style={{ color: BRAND_ORANGE }} /> Find Friends
        </h2>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "var(--secondary)", borderRadius: 12,
          border: "1px solid var(--border)", padding: "4px 14px",
        }}>
          <Search className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search by username…"
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              padding: "10px 0", fontSize: 14, color: "var(--foreground)",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          />
          {searching && <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: `${BRAND_ORANGE} transparent` }} />}
        </div>

        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 space-y-2">
              {searchResults.map(u => (
                <div key={u.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 12,
                  background: "var(--secondary)", border: "1px solid var(--border)",
                }}>
                  <UserAvatar username={u.username} name={u.name} size={36} />
                  <div style={{ flex: 1 }}>
                    <div className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{u.name}</div>
                    <div className="text-xs text-muted-foreground">@{u.username} · {u.level} · {u.xp} XP</div>
                  </div>
                  <button onClick={() => addFriend(u.id)} style={{
                    background: `linear-gradient(135deg, ${BRAND_ORANGE}, #FF6B3D)`,
                    color: "#fff", border: "none", borderRadius: 10,
                    padding: "7px 12px", cursor: "pointer",
                    fontSize: 12, fontWeight: 600,
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}>
                    <UserPlus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pending requests */}
      {pending.length > 0 && (
        <div className="glass rounded-3xl p-5">
          <h2 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: BRAND_ORANGE }} /> Friend Requests
            <span style={{
              background: BRAND_ORANGE, color: "#fff",
              borderRadius: 99, padding: "1px 8px", fontSize: 12, fontWeight: 700,
            }}>{pending.length}</span>
          </h2>
          <div className="space-y-2">
            {pending.map(f => (
              <div key={f.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 12,
                background: "rgba(255,77,46,0.06)", border: "1px solid rgba(255,77,46,0.2)",
              }}>
                <UserAvatar username={f.other?.username ?? "?"} name={f.other?.name} size={36} />
                <div style={{ flex: 1 }}>
                  <div className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{f.other?.name}</div>
                  <div className="text-xs text-muted-foreground">@{f.other?.username}</div>
                </div>
                <button onClick={() => respond(f.id, true)} style={{
                  background: `linear-gradient(135deg, ${BRAND_ORANGE}, #FF6B3D)`,
                  color: "#fff", border: "none", borderRadius: 8, padding: "7px",
                  cursor: "pointer",
                }}>
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => respond(f.id, false)} style={{
                  background: "var(--secondary)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "7px", cursor: "pointer", color: "var(--muted-foreground)",
                }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends list */}
      <div className="glass rounded-3xl p-5">
        <h2 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" style={{ color: BRAND_ORANGE }} /> My Friends
          <span className="text-muted-foreground text-sm font-normal">({accepted.length})</span>
        </h2>

        {accepted.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No friends yet — search for someone above!
          </p>
        ) : (
          <div className="space-y-2">
            {accepted.map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 12,
                  background: "var(--secondary)", border: "1px solid var(--border)",
                }}
              >
                <UserAvatar username={f.other?.username ?? "?"} name={f.other?.name} size={40} />
                <div style={{ flex: 1 }}>
                  <div className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{f.other?.name}</div>
                  <div className="text-xs text-muted-foreground">@{f.other?.username} · {f.other?.level} · {f.other?.xp} XP</div>
                </div>
                <button
                  onClick={() => navigate("/rooms")}
                  style={{
                    background: "var(--background)", border: "1px solid var(--border)",
                    borderRadius: 8, padding: "7px 12px", cursor: "pointer",
                    fontSize: 12, fontFamily: "'Space Grotesk', sans-serif",
                    color: "var(--foreground)",
                  }}
                >
                  📚 Study
                </button>
                <button onClick={() => remove(f.id)} style={{
                  background: "transparent", border: "none", padding: 6,
                  cursor: "pointer", color: "var(--muted-foreground)",
                }}>
                  <UserMinus className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Sent requests */}
      {sent.length > 0 && (
        <div className="glass rounded-3xl p-5">
          <h2 className="font-display font-semibold text-base mb-3 text-muted-foreground">Sent Requests</h2>
          <div className="space-y-2">
            {sent.map(f => (
              <div key={f.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 12,
                background: "var(--secondary)", border: "1px solid var(--border)",
                opacity: 0.7,
              }}>
                <UserAvatar username={f.other?.username ?? "?"} size={32} />
                <div style={{ flex: 1 }}>
                  <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>@{f.other?.username}</div>
                  <div className="text-xs text-muted-foreground">Pending…</div>
                </div>
                <button onClick={() => remove(f.id)} style={{
                  background: "transparent", border: "none", padding: 6,
                  cursor: "pointer", color: "var(--muted-foreground)",
                }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
