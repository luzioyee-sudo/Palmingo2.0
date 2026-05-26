import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import {
  Trophy, Flame, Copy, Check, Users, Swords,
  Crown, Medal, Star, ArrowRight, Zap, Target,
} from "lucide-react";
import { getProgress } from "@/lib/progress";
import { useAuth } from "@/lib/auth";

/* ── Types ─────────────────────────────────────────────── */
interface Friend {
  id: string;
  name: string;
  xp: number;
  streak: number;
  level: string;
  avatar?: string;
}

/* ── Mock friends seed ─────────────────────────────────── */
const SEED_FRIENDS: Friend[] = [
  { id: "f1", name: "Sara M.",    xp: 420, streak: 7,  level: "B1" },
  { id: "f2", name: "Ahmed K.",   xp: 310, streak: 5,  level: "A2" },
  { id: "f3", name: "Lena R.",    xp: 580, streak: 12, level: "B2" },
  { id: "f4", name: "Carlos P.",  xp: 240, streak: 3,  level: "A2" },
  { id: "f5", name: "Yuki T.",    xp: 720, streak: 21, level: "B2" },
  { id: "f6", name: "Fatima A.",  xp: 155, streak: 2,  level: "A1" },
  { id: "f7", name: "Marco B.",   xp: 890, streak: 14, level: "C1" },
];

const FRIENDS_KEY = "palmingo:friends";

function getStoredFriends(): Friend[] {
  try {
    const raw = localStorage.getItem(FRIENDS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function initFriends(): Friend[] {
  const existing = getStoredFriends();
  if (existing) return existing;
  localStorage.setItem(FRIENDS_KEY, JSON.stringify(SEED_FRIENDS));
  return SEED_FRIENDS;
}

function makeInviteCode(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash * 31 + email.charCodeAt(i)) & 0xfffffff;
  }
  return hash.toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
}

/* ── Avatar bubble ─────────────────────────────────────── */
const BRAND_ORANGE = "oklch(0.65 0.22 35)";
const COLORS = [
  "oklch(0.65 0.2 250)", "oklch(0.7 0.2 180)", "oklch(0.68 0.22 320)",
  "oklch(0.72 0.2 60)",  "oklch(0.65 0.22 150)", "oklch(0.7 0.2 30)",
];

function FriendAvatar({ name, size = 40, colorIdx = 0 }: { name: string; size?: number; colorIdx?: number }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${COLORS[colorIdx % COLORS.length]}, ${COLORS[(colorIdx + 1) % COLORS.length]})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 700, fontSize: size * 0.36,
      fontFamily: "'Space Grotesk', sans-serif", flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

/* ── Rank medal ─────────────────────────────────────────── */
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-5 h-5" style={{ color: "#F59E0B" }} />;
  if (rank === 2) return <Medal className="w-5 h-5" style={{ color: "#94A3B8" }} />;
  if (rank === 3) return <Medal className="w-5 h-5" style={{ color: "#CD7F32" }} />;
  return <span className="text-sm font-bold text-muted-foreground" style={{ minWidth: 20, textAlign: "center" }}>#{rank}</span>;
}

/* ── Study Together topics ─────────────────────────────── */
const STUDY_TOPICS = [
  { label: "Debate a topic",   emoji: "🗣️", scenario: "Debate practice",     accent: "from-[oklch(0.65_0.2_250)] to-[oklch(0.55_0.22_280)]" },
  { label: "Order at a café",  emoji: "☕", scenario: "Ordering at a cafe",  accent: "from-[oklch(0.75_0.18_60)] to-[oklch(0.65_0.22_30)]"  },
  { label: "Job interview",    emoji: "💼", scenario: "Job interview",        accent: "from-[oklch(0.7_0.22_320)] to-[oklch(0.6_0.25_290)]"   },
  { label: "Travel & airport", emoji: "✈️", scenario: "Travel & airport",    accent: "from-[oklch(0.75_0.2_180)] to-[oklch(0.65_0.22_210)]"  },
];

/* ── Main page ─────────────────────────────────────────── */
export default function Friends() {
  const { user } = useAuth();
  const [progress] = useState(() => getProgress());
  const [friends]  = useState<Friend[]>(() => initFriends());
  const [copied, setCopied]   = useState(false);

  const inviteCode = makeInviteCode(user?.email ?? "palmingo");
  const inviteLink = `${window.location.origin}/?invite=${inviteCode}`;

  /* Build leaderboard: friends + the user */
  const me: Friend = {
    id: "me",
    name: user?.name ?? "You",
    xp: progress.xp,
    streak: progress.streak,
    level: progress.level,
  };

  const board = [...friends, me].sort((a, b) => b.xp - a.xp);
  const myRank = board.findIndex(f => f.id === "me") + 1;
  const myColorIdx = board.findIndex(f => f.id === "me");

  /* Weekly XP: simulate weekly progress for friends (capped at some value) */
  const weeklyGoal = 500;
  const myWeeklyXp = Math.min(weeklyGoal, Math.round(progress.xp * 0.18));
  const topFriend  = friends.sort((a, b) => b.xp - a.xp)[0];
  const topFriendWeekly = Math.min(weeklyGoal, Math.round(topFriend.xp * 0.18));

  const handleCopy = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Join me on Palmingo!", url: inviteLink });
      } else {
        await navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {}
    }
  }, [inviteLink]);

  return (
    <div className="space-y-6 pb-6">
      {/* ── Header ── */}
      <header>
        <h1 className="text-3xl md:text-4xl font-bold">Learn with Friends</h1>
        <p className="text-muted-foreground text-sm mt-1">Compete, invite, and study together.</p>
      </header>

      {/* ── My rank card ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
        className="glass rounded-3xl p-5 flex items-center gap-4"
      >
        <div className="relative">
          <FriendAvatar name={me.name} size={56} colorIdx={myColorIdx} />
          <div style={{
            position: "absolute", bottom: -4, right: -4,
            background: `linear-gradient(135deg, ${BRAND_ORANGE}, #FF6B3D)`,
            borderRadius: "50%", width: 22, height: 22,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid var(--background)",
          }}>
            <Star className="w-3 h-3 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold text-lg truncate">{me.name}</div>
          <div className="text-sm text-muted-foreground">Rank #{myRank} among friends · {me.level}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4" style={{ color: BRAND_ORANGE }} />
            <span className="font-display font-bold text-xl">{me.xp}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Flame className="w-3 h-3 text-orange-400" />
            {me.streak}d streak
          </div>
        </div>
      </motion.div>

      {/* ── Leaderboard ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="glass rounded-3xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5" style={{ color: BRAND_ORANGE }} />
          <h2 className="font-display font-semibold text-lg">Leaderboard</h2>
        </div>

        <div className="flex flex-col gap-1.5">
          {board.map((friend, idx) => {
            const rank   = idx + 1;
            const isMe   = friend.id === "me";
            const colorI = idx;
            const maxXp  = board[0].xp || 1;

            return (
              <motion.div
                key={friend.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 + idx * 0.04 }}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 12px", borderRadius: 14,
                  background: isMe
                    ? `linear-gradient(135deg, rgba(255,77,46,0.12), rgba(255,107,61,0.06))`
                    : "transparent",
                  border: isMe ? "1px solid rgba(255,77,46,0.25)" : "1px solid transparent",
                  transition: "all 0.2s",
                }}
              >
                {/* Rank */}
                <div style={{ width: 28, display: "flex", justifyContent: "center", flexShrink: 0 }}>
                  <RankBadge rank={rank} />
                </div>

                {/* Avatar */}
                <FriendAvatar name={friend.name} size={36} colorIdx={colorI} />

                {/* Name + bar */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: isMe ? 700 : 500,
                    fontFamily: "'Space Grotesk', sans-serif",
                    color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {isMe ? `${friend.name} (you)` : friend.name}
                  </div>
                  <div style={{
                    marginTop: 4, height: 4, borderRadius: 99,
                    background: "var(--muted)", overflow: "hidden",
                  }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(friend.xp / maxXp) * 100}%` }}
                      transition={{ delay: 0.2 + idx * 0.04, duration: 0.6 }}
                      style={{
                        height: "100%", borderRadius: 99,
                        background: isMe
                          ? `linear-gradient(90deg, ${BRAND_ORANGE}, #FF6B3D)`
                          : `linear-gradient(90deg, ${COLORS[colorI % COLORS.length]}, ${COLORS[(colorI+1)%COLORS.length]})`,
                      }}
                    />
                  </div>
                </div>

                {/* XP */}
                <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: "var(--foreground)", flexShrink: 0 }}>
                  {friend.xp.toLocaleString()} XP
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Weekly Challenge ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass rounded-3xl p-5"
      >
        <div className="flex items-center gap-2 mb-1">
          <Swords className="w-5 h-5" style={{ color: BRAND_ORANGE }} />
          <h2 className="font-display font-semibold text-lg">Weekly Challenge</h2>
          <span className="ml-auto text-xs text-muted-foreground">Resets Sunday</span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Who earns the most XP this week?</p>

        {/* You vs top friend */}
        <div className="flex flex-col gap-3">
          {/* Me */}
          <div className="flex items-center gap-3">
            <FriendAvatar name={me.name} size={32} colorIdx={0} />
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium" style={{ color: "var(--foreground)" }}>You</span>
                <span className="text-muted-foreground">{myWeeklyXp} / {weeklyGoal} XP</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(myWeeklyXp / weeklyGoal) * 100}%` }}
                  transition={{ delay: 0.3, duration: 0.7 }}
                  className="h-full gradient-primary"
                  style={{ borderRadius: 99 }}
                />
              </div>
            </div>
          </div>

          {/* Top friend */}
          <div className="flex items-center gap-3">
            <FriendAvatar name={topFriend.name} size={32} colorIdx={2} />
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium" style={{ color: "var(--foreground)" }}>{topFriend.name}</span>
                <span className="text-muted-foreground">{topFriendWeekly} / {weeklyGoal} XP</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(topFriendWeekly / weeklyGoal) * 100}%` }}
                  transition={{ delay: 0.35, duration: 0.7 }}
                  style={{
                    height: "100%", borderRadius: 99,
                    background: `linear-gradient(90deg, oklch(0.68 0.22 320), oklch(0.58 0.25 290))`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          {myWeeklyXp >= topFriendWeekly
            ? <p className="text-sm font-medium" style={{ color: BRAND_ORANGE }}>🔥 You're winning this week! Keep it up.</p>
            : <p className="text-sm text-muted-foreground">
                You need <strong>{topFriendWeekly - myWeeklyXp} more XP</strong> to beat {topFriend.name}!
              </p>
          }
          <Link
            to="/home"
            className="inline-flex mt-3 items-center gap-2 gradient-primary text-white px-5 py-2.5 rounded-2xl text-sm font-medium"
          >
            <Zap className="w-4 h-4" /> Earn XP now
          </Link>
        </div>
      </motion.div>

      {/* ── Study Together ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5" style={{ color: BRAND_ORANGE }} />
          <h2 className="font-display font-semibold text-lg">Study Together</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {STUDY_TOPICS.map((topic, i) => (
            <motion.div
              key={topic.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.18 + i * 0.04 }}
            >
              <Link
                to={`/laxa?scenario=${encodeURIComponent(topic.scenario)}`}
                className="glass rounded-2xl p-4 block group hover:scale-[1.02] transition"
                style={{ textDecoration: "none" }}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${topic.accent} flex items-center justify-center text-xl`}>
                  {topic.emoji}
                </div>
                <div className="mt-3 font-display font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                  {topic.label}
                </div>
                <div className="mt-1.5 flex items-center gap-1 text-xs" style={{ color: BRAND_ORANGE }}>
                  Practice with Laxa <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Invite Friends ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass rounded-3xl p-5"
      >
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-5 h-5" style={{ color: BRAND_ORANGE }} />
          <h2 className="font-display font-semibold text-lg">Invite Friends</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Share your invite link and compete together on the leaderboard.
        </p>

        {/* Invite code display */}
        <div style={{
          background: "var(--secondary)",
          border: "1px dashed var(--border)",
          borderRadius: 14, padding: "10px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 12,
        }}>
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Your invite code</div>
            <div className="font-display font-bold text-xl tracking-widest" style={{ color: BRAND_ORANGE }}>
              {inviteCode}
            </div>
          </div>
          <div className="text-xs text-muted-foreground" style={{ maxWidth: 140, textAlign: "right", wordBreak: "break-all" }}>
            {inviteLink.replace("https://", "")}
          </div>
        </div>

        <button
          onClick={handleCopy}
          style={{
            width: "100%",
            background: copied
              ? "oklch(0.55 0.18 150)"
              : `linear-gradient(135deg, ${BRAND_ORANGE}, #FF6B3D)`,
            color: "#fff", border: "none", borderRadius: 14,
            padding: "13px 20px", cursor: "pointer",
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all 0.25s",
            boxShadow: "0 4px 14px rgba(255,77,46,0.3)",
          }}
        >
          {copied
            ? <><Check className="w-4 h-4" /> Link copied!</>
            : <><Copy className="w-4 h-4" /> Copy invite link</>
          }
        </button>
      </motion.div>
    </div>
  );
}
