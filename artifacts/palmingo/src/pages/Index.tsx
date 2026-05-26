import { Link } from "wouter";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Layers, BookOpen, Sparkles, Youtube, Mic, ArrowRight, Flame, Trophy, Target } from "lucide-react";
import { PalmLogo, AIOrb } from "@/components/Logo";
import { YourPalm } from "@/components/YourPalm";
import { FilmFlashcards, FilmVoiceTutor, FilmDictionary, FilmVideos } from "@/components/FeatureFilm";
import { getProgress, type Progress } from "@/lib/progress";

const films = [
  { to: "/flashcards", title: "Voice Flashcards", desc: "Swipe, hear, repeat. Real pronunciation, spaced repetition.", icon: Layers, Film: FilmFlashcards },
  { to: "/tutor", title: "AI Voice Tutor", desc: "Talk with an agent that adapts to your level and goals.", icon: Mic, Film: FilmVoiceTutor },
  { to: "/dictionary", title: "Smart Dictionary", desc: "IPA, meaning, translation and examples — in one tap.", icon: BookOpen, Film: FilmDictionary },
  { to: "/videos", title: "Video Hub", desc: "Search YouTube, watch in-app, tap any word to save.", icon: Youtube, Film: FilmVideos },
];

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
        {icon} {label}
      </div>
      <div className="mt-1 text-2xl font-display font-semibold text-gradient">{value}</div>
    </div>
  );
}

export default function Index() {
  const [p, setP] = useState<Progress>(() => getProgress());
  useEffect(() => {
    const onUpd = () => setP(getProgress());
    window.addEventListener("palmingo:progress", onUpd);
    return () => window.removeEventListener("palmingo:progress", onUpd);
  }, []);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass rounded-4xl p-7 md:p-14 relative overflow-hidden"
      >
        <motion.div
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[oklch(0.75_0.14_180)] opacity-30 blur-3xl"
          animate={{ x: [0, 20, 0], y: [0, -10, 0] }} transition={{ duration: 12, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[oklch(0.65_0.14_240)] opacity-30 blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, 10, 0] }} transition={{ duration: 14, repeat: Infinity }}
        />
        <div className="relative grid md:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-xs text-muted-foreground">
              <AIOrb size={16} /> Gemini-powered tutor
            </div>
            <h1 className="mt-5 text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
              Plant a word.<br />
              <span className="text-gradient">Grow your language.</span>
            </h1>
            <p className="mt-4 max-w-xl text-muted-foreground text-base md:text-lg">
              Palmingo turns daily practice into a living palm tree. Voice cards, a real-time AI tutor, and interactive videos — beautifully simple, on every device.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/tutor" className="gradient-primary text-white px-5 py-3 rounded-2xl text-sm font-medium glow inline-flex items-center gap-2">
                Talk to your tutor <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/flashcards" className="glass px-5 py-3 rounded-2xl text-sm font-medium">
                Start with cards
              </Link>
            </div>
          </div>
          <div className="hidden md:block w-44">
            <PalmLogo size={120} showWord={false} />
          </div>
        </div>
      </motion.section>

      {/* Progress + Your Palm */}
      <section className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <YourPalm />
        </div>
        <div className="md:col-span-2 grid grid-cols-2 gap-3">
          <Stat icon={<Flame className="w-4 h-4" />} label="Day streak" value={p.streak} />
          <Stat icon={<Trophy className="w-4 h-4" />} label="XP" value={p.xp} />
          <Stat icon={<BookOpen className="w-4 h-4" />} label="Words learned" value={p.wordsLearned} />
          <Stat icon={<Target className="w-4 h-4" />} label="Cards reviewed" value={p.cardsReviewed} />
          <div className="glass rounded-2xl p-4 col-span-2">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Weekly activity</div>
            <div className="flex items-end gap-2 h-20">
              {[0.4, 0.7, 0.3, 0.9, 0.6, 0.85, Math.min(1, p.streak ? 0.9 : 0.1)].map((v, i) => (
                <motion.div
                  key={i}
                  className="flex-1 rounded-lg gradient-primary"
                  initial={{ height: 0 }} animate={{ height: `${v * 100}%` }}
                  transition={{ delay: 0.1 + i * 0.06, type: "spring", stiffness: 120, damping: 16 }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature films */}
      <section>
        <div className="flex items-end justify-between mb-4 px-1">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold">See it in motion</h2>
            <p className="text-sm text-muted-foreground">Four tools, one calm workflow.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {films.map((f, i) => {
            const Icon = f.icon;
            const Film = f.Film;
            return (
              <motion.div
                key={f.to}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: i * 0.08, duration: 0.55 }}
              >
                <Link to={f.to} className="glass-strong rounded-3xl p-4 md:p-5 block group hover:scale-[1.01] transition">
                  <Film />
                  <div className="mt-4 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-primary glow grid place-items-center text-white shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-semibold text-lg">{f.title}</div>
                      <div className="text-sm text-muted-foreground">{f.desc}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 mt-2 text-muted-foreground group-hover:translate-x-1 transition" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <motion.section
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        className="glass rounded-4xl p-8 md:p-12 text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(at_50%_0%,oklch(0.7_0.14_200/0.25),transparent_60%)]" />
        <div className="relative">
          <div className="flex justify-center mb-3"><AIOrb size={48} active /></div>
          <h2 className="text-2xl md:text-3xl font-bold">Your AI knows your level.</h2>
          <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
            Palmingo's agent reads your streak, words and accuracy — and adapts every conversation to you.
          </p>
          <Link to="/tutor" className="inline-flex mt-6 gradient-primary text-white px-5 py-3 rounded-2xl text-sm font-medium glow items-center gap-2">
            Start a session <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
