import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Flame, Trophy, BookOpen, Layers } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { YourPalm } from "@/components/YourPalm";
import { getProgress, type Progress } from "@/lib/progress";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as [number,number,number,number] } },
};

export default function Home() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [p, setP] = useState<Progress>(() => getProgress());

  useEffect(() => {
    const onUpd = () => setP(getProgress());
    window.addEventListener("palmingo:progress", onUpd);
    return () => window.removeEventListener("palmingo:progress", onUpd);
  }, []);

  const h = new Date().getHours();
  const greetingKey =
    h < 5  ? "greeting_night"    :
    h < 12 ? "greeting_morning"  :
    h < 17 ? "greeting_afternoon" :
             "greeting_evening";

  const xpToNext = 500;
  const xpProgress = Math.min(100, (p.xp % xpToNext) / xpToNext * 100);
  const today = new Date().getDay();
  const week = [42, 65, 80, 50, 90, 72, 35].map((v, i) =>
    i === 6 ? Math.max(v, p.streak ? 60 : 5) : v
  );
  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
  const orderedDays = Array.from({ length: 7 }, (_, i) => dayLabels[(today - 6 + i + 7) % 7]);

  const stats = [
    { labelKey: "stat_streak",   value: p.streak,       suffix: "🔥", icon: Flame,   color: "from-orange-400 to-red-500"    },
    { labelKey: "stat_xp",       value: p.xp,           suffix: "",   icon: Trophy,  color: "from-yellow-400 to-amber-500"  },
    { labelKey: "stat_words",    value: p.wordsLearned, suffix: "",   icon: BookOpen, color: "from-teal-400 to-cyan-500"    },
    { labelKey: "stat_cards_r",  value: p.cardsReviewed,suffix: "",   icon: Layers,  color: "from-purple-400 to-violet-500" },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-5 max-w-2xl mx-auto">
      {/* Greeting */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl md:text-3xl font-bold">
          {t(greetingKey)}{user?.name ? `, ${user.name}` : ""} {h < 5 || h >= 17 ? "🌙" : h < 12 ? "🌅" : "☀️"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {user?.targetLang
            ? `${t("learning_prefix")} ${user.targetLang} · ${user.level ?? p.level}`
            : t("keep_growing")}
        </p>
      </motion.div>

      {/* Palm tree */}
      <motion.div variants={fadeUp} className="flex justify-center">
        <div className="w-full">
          <YourPalm />
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div variants={stagger} className="grid grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.labelKey} variants={fadeUp} className="glass rounded-2xl p-3 md:p-4 text-center">
              <div className={`w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto mb-2`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="text-lg md:text-2xl font-bold leading-none">
                {s.value}{s.suffix}
              </div>
              <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5 uppercase tracking-wide">
                {t(s.labelKey)}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Weekly activity */}
      <motion.div variants={fadeUp} className="glass rounded-3xl p-5">
        <h2 className="font-semibold text-sm md:text-base mb-4">📅 {t("weekly_activity")}</h2>
        <div className="flex items-end gap-2 h-24">
          {week.map((v, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${v}%` }}
              transition={{ delay: i * 0.06, duration: 0.5, ease: "easeOut" }}
              className={`flex-1 rounded-t-xl ${i === 6 ? "gradient-primary glow" : "bg-primary/30"}`}
            />
          ))}
        </div>
        <div className="flex mt-2">
          {orderedDays.map((d, i) => (
            <span key={i} className={`flex-1 text-center text-[10px] md:text-xs ${i === 6 ? "text-primary font-bold" : "text-muted-foreground"}`}>{d}</span>
          ))}
        </div>
      </motion.div>

      {/* XP Progress */}
      <motion.div variants={fadeUp} className="glass rounded-3xl p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-sm md:text-base">⚡ {t("xp_progress")}</h2>
          <span className="text-xs text-muted-foreground">{p.xp % xpToNext} / {xpToNext} {t("to_milestone")}</span>
        </div>
        <div className="mt-3 h-3 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full gradient-primary rounded-full"
          />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 text-center text-xs">
          {[
            { labelKey: "cefr_label",   value: user?.level ?? p.level },
            { labelKey: "target_label", value: user?.targetLang ?? p.targetLang },
            { labelKey: "native_label", value: user?.nativeLang ?? p.nativeLang },
          ].map((item) => (
            <div key={item.labelKey} className="glass rounded-xl p-2.5">
              <div className="font-bold text-sm">{item.value || "—"}</div>
              <div className="text-muted-foreground text-[10px] mt-0.5">{t(item.labelKey)}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
