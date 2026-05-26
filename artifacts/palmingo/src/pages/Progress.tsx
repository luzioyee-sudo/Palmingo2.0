import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Flame, Trophy, Target, Clock, BookOpen, Layers } from "lucide-react";
import { getProgress, type Progress } from "@/lib/progress";

export default function ProgressPage() {
  const [p, setP] = useState<Progress>(() => getProgress());

  useEffect(() => {
    const onUpd = () => setP(getProgress());
    window.addEventListener("palmingo:progress", onUpd);
    return () => window.removeEventListener("palmingo:progress", onUpd);
  }, []);

  const week = [40, 60, 80, 45, 90, 75, Math.min(100, p.streak ? 95 : 10)];
  const xpToNext = 1000;
  const xpProgress = Math.min(100, (p.xp % xpToNext) / xpToNext * 100);

  const stats = [
    { label: "Streak", value: `${p.streak} days`, icon: Flame, accent: "from-[oklch(0.75_0.22_30)] to-[oklch(0.65_0.25_10)]" },
    { label: "Total XP", value: String(p.xp), icon: Trophy, accent: "from-[oklch(0.8_0.18_80)] to-[oklch(0.7_0.22_50)]" },
    { label: "Words", value: String(p.wordsLearned), icon: BookOpen, accent: "from-[oklch(0.75_0.2_180)] to-[oklch(0.65_0.22_220)]" },
    { label: "Cards", value: String(p.cardsReviewed), icon: Layers, accent: "from-[oklch(0.72_0.22_295)] to-[oklch(0.62_0.25_330)]" },
    { label: "Level", value: p.level, icon: Target, accent: "from-[oklch(0.68_0.2_160)] to-[oklch(0.58_0.22_200)]" },
    { label: "Minutes", value: String(p.minutesPracticed), icon: Clock, accent: "from-[oklch(0.72_0.22_250)] to-[oklch(0.62_0.25_280)]" },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold">Your Progress</h1>
        <p className="text-muted-foreground text-sm mt-1">Keep the streak alive.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-3xl p-5"
              data-testid={`stat-${s.label.toLowerCase()}`}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.accent} flex items-center justify-center text-white`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="mt-3 text-2xl font-display font-semibold">{s.value}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{s.label}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="glass rounded-3xl p-6">
        <h2 className="font-display font-semibold text-lg">This week</h2>
        <div className="mt-6 flex items-end gap-3 h-40">
          {week.map((v, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${v}%` }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className="flex-1 rounded-t-xl gradient-primary glow"
            />
          ))}
        </div>
        <div className="mt-3 flex justify-between text-xs text-muted-foreground">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i} className="flex-1 text-center">{d}</span>)}
        </div>
      </div>

      <div className="glass rounded-3xl p-6">
        <h2 className="font-display font-semibold text-lg">XP progress</h2>
        <p className="text-xs text-muted-foreground mt-1">{p.xp % xpToNext} / {xpToNext} XP to next milestone</p>
        <div className="mt-4 h-3 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress}%` }}
            transition={{ duration: 0.8 }}
            className="h-full gradient-primary"
          />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-center text-muted-foreground">
          <div className="glass rounded-2xl p-3">
            <div className="text-lg font-display font-semibold text-foreground">{p.level}</div>
            <div>CEFR Level</div>
          </div>
          <div className="glass rounded-2xl p-3">
            <div className="text-lg font-display font-semibold text-foreground">{p.targetLang}</div>
            <div>Target lang</div>
          </div>
          <div className="glass rounded-2xl p-3">
            <div className="text-lg font-display font-semibold text-foreground">{p.nativeLang}</div>
            <div>Native lang</div>
          </div>
        </div>
      </div>
    </div>
  );
}
