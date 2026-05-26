import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "wouter";
import { ArrowRight, Star, ChevronRight, Globe, Check, Youtube, Layers, Mic, TreePine, BarChart2 } from "lucide-react";
import { TutorDemo, VideoDemo, FlashcardsDemo, DictionaryDemo, ProgressDemo } from "@/components/DemoScreens";
import type { Variants } from "framer-motion";

/* ── Laxa brand tokens ─────────────────────────────────── */
const C = {
  orange:  "#FF4D2E",
  orange2: "#FFB37A",
  ink:     "#0A0A0F",
  muted:   "#7a7a82",
};

/* ── Laxa sparkle icon ─────────────────────────────────── */
function LaxaSparkle({ size = 24, className = "", style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className={className} style={style} aria-hidden="true" fill="currentColor">
      <path d="M100 8 C 104 60, 140 96, 192 100 C 140 104, 104 140, 100 192 C 96 140, 60 104, 8 100 C 60 96, 96 60, 100 8 Z" />
    </svg>
  );
}

/* ── scroll-triggered fade-up ──────────────────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.55, ease: [0.25, 0.1, 0.25, 1] as [number,number,number,number] },
  }),
};

function FadeIn({ children, className = "", delay = 0, style }: {
  children: React.ReactNode; className?: string; delay?: number; style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} variants={fadeUp} initial="hidden" animate={inView ? "visible" : "hidden"} custom={delay} className={className} style={style}>
      {children}
    </motion.div>
  );
}

/* ── data ──────────────────────────────────────────────── */
const features = [
  { icon: Youtube,    title: "Watch & Learn",    desc: "Paste any YouTube link. Every subtitle word becomes tappable — translate, save, and pronounce instantly." },
  { icon: Layers,     title: "Smart Flashcards", desc: "Save words in one tap. Review them in a swipe-deck with spaced repetition and TTS pronunciation." },
  { icon: Mic,        title: "Laxa AI Tutor",    desc: "Practice real conversations with Laxa — adapts to your level, corrects gently, and responds by voice or text." },
  { icon: TreePine,   title: "Grow Your Palm",   desc: "Every session adds XP. Your palm tree grows taller and sprouts new fronds as you hit milestones." },
  { icon: BarChart2,  title: "Track Progress",   desc: "Streak, XP, word count, weekly chart — every metric you need to stay on track and celebrate growth." },
];

const steps = [
  {
    num: "01",
    title: "Laxa AI — your personal language coach",
    desc: "Laxa knows your level, your goals, and everything you've learned. Speak or type — it corrects you gently and fully adapts to your pace.",
    demo: <TutorDemo />,
  },
  {
    num: "02",
    title: "Watch videos, tap any word instantly",
    desc: "Paste any YouTube link. Every caption word becomes interactive — tap to hear pronunciation, see the meaning, understand the grammar, and save it in one tap.",
    demo: <VideoDemo />,
  },
  {
    num: "03",
    title: "Smart Flashcards with spaced repetition",
    desc: "Flip cards, rate your recall, and let the algorithm surface the right word at the right time. Audio pronunciation built in. Earn XP every session.",
    demo: <FlashcardsDemo />,
  },
  {
    num: "04",
    title: "Smart Dictionary — any word, instantly",
    desc: "Search any word for IPA, translation, and examples. Save it to a flashcard deck in one tap. Grammar context included.",
    demo: <DictionaryDemo />,
  },
  {
    num: "05",
    title: "Progress that keeps you motivated",
    desc: "Track XP, streaks, word counts, and weekly activity. Watch your palm tree grow as your level rises — a living metaphor for your language journey.",
    demo: <ProgressDemo />,
  },
];

const testimonials = [
  { name: "Sara M.",  flag: "🇩🇪", role: "Learning German",  text: "I went from zero to B1 in 6 months with Palmingo every day. Laxa catches every mistake — so gently I never feel bad about it." },
  { name: "Ahmed K.", flag: "🇫🇷", role: "Learning French",  text: "Laxa adapts incredibly fast. After two weeks it knew exactly which words I kept forgetting and drilled them perfectly." },
  { name: "Yuki T.",  flag: "🇬🇧", role: "Learning English", text: "Watching YouTube and saving words at the same time is genius. 20+ new words per session with zero extra effort." },
];

const stats = [
  { value: "12+",    label: "Languages supported" },
  { value: "50 k",   label: "Words learned daily" },
  { value: "2 000+", label: "Active learners" },
  { value: "4.9 ★",  label: "Average rating" },
];

/* ── Hero right side — floating UI cards ────────────────── */
function HeroCards() {
  return (
    <div className="relative w-full max-w-sm mx-auto" style={{ height: 340 }}>
      {/* glow blob */}
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `${C.orange}08`, filter: "blur(48px)", transform: "scale(1.3)" }} />

      {/* card 1 — Laxa AI chat bubble */}
      <motion.div
        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, background: "#fff", borderRadius: 18, padding: "14px 16px", boxShadow: `0 8px 32px rgba(0,0,0,.09), 0 0 0 1px rgba(10,10,15,.05)` }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.orange, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LaxaSparkle size={14} style={{ color: "#fff" }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, fontFamily: "'Space Grotesk',sans-serif" }}>Laxa</div>
            <div style={{ fontSize: 9, color: C.muted }}>Powered by Palmingo · online</div>
          </div>
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
        </div>
        <div style={{ background: "#f8f7f5", borderRadius: "12px 12px 12px 3px", padding: "8px 11px", fontSize: 10, color: C.ink, lineHeight: 1.6, marginBottom: 8, maxWidth: "88%" }}>
          Bonjour! Let's practice ordering coffee in French. What would you like? ☕
        </div>
        <div style={{ background: C.orange, borderRadius: "12px 12px 3px 12px", padding: "8px 11px", fontSize: 10, color: "#fff", marginLeft: "auto", maxWidth: "72%", textAlign: "right" }}>
          Un café, s'il vous plaît!
        </div>
      </motion.div>

      {/* card 2 — word card */}
      <motion.div
        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.55, duration: 0.6 }}
        style={{ position: "absolute", top: 200, right: -12, background: "#fff", borderRadius: 16, padding: "10px 14px", boxShadow: `0 8px 24px rgba(0,0,0,.08), 0 0 0 1px rgba(10,10,15,.05)`, minWidth: 160 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, letterSpacing: "-0.02em", fontFamily: "'Space Grotesk',sans-serif" }}>serendipity</div>
          <div style={{ background: `${C.orange}15`, color: C.orange, borderRadius: 5, padding: "1px 5px", fontSize: 8, fontWeight: 700 }}>noun</div>
        </div>
        <div style={{ fontSize: 9, color: C.muted, fontFamily: "monospace", marginBottom: 4 }}>/ˌsɛrənˈdɪpɪti/</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.orange }}>مصادفة سعيدة</div>
      </motion.div>

      {/* card 3 — XP badge */}
      <motion.div
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0, y: [0, -6, 0] }}
        transition={{ delay: 0.8, duration: 0.6, y: { delay: 1.4, duration: 3, repeat: Infinity, ease: "easeInOut" } }}
        style={{ position: "absolute", top: 218, left: -8, background: C.ink, color: "#fff", borderRadius: 14, padding: "8px 14px", boxShadow: `0 8px 20px rgba(0,0,0,.18)` }}
      >
        <div style={{ fontSize: 9, color: "rgba(255,255,255,.55)", marginBottom: 2 }}>This week</div>
        <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.03em", fontFamily: "'Space Grotesk',sans-serif" }}>
          +<motion.span animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}>740</motion.span> XP 🔥
        </div>
      </motion.div>

      {/* card 4 — streak */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        style={{ position: "absolute", top: 168, left: "50%", transform: "translateX(-50%)", background: `${C.orange}15`, borderRadius: 100, padding: "5px 14px", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}
      >
        <LaxaSparkle size={10} style={{ color: C.orange }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: C.orange }}>7-day streak</span>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════════════════════════ */
export default function Landing() {
  return (
    <div style={{ background: "#ffffff", color: C.ink }} className="overflow-x-hidden font-['Inter',sans-serif]">

      {/* ── HEADER ──────────────────────────────────────── */}
      <header style={{ borderBottom: "1px solid rgba(10,10,15,.07)", background: "rgba(255,255,255,.92)" }}
        className="sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <LaxaSparkle size={20} style={{ color: C.orange }} />
            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>
              Palmingo
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm" style={{ color: C.muted }}>
            <a href="#features" className="hover:opacity-60 transition">Features</a>
            <a href="#how" className="hover:opacity-60 transition">How It Works</a>
            <a href="#testimonials" className="hover:opacity-60 transition">Reviews</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" style={{ color: C.muted }} className="text-sm hover:opacity-60 transition px-3 py-1.5 hidden sm:block">Sign in</Link>
            <Link to="/login"
              style={{ background: C.orange, color: "#fff" }}
              className="text-sm font-semibold px-4 py-2 rounded-full flex items-center gap-1.5 hover:opacity-90 transition">
              Get Started <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-28" style={{ background: "#fff" }}>
        {/* soft orange blobs */}
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
          <div style={{ position: "absolute", top: 0, right: 0, width: 480, height: 480, borderRadius: "50%", background: `${C.orange}09`, filter: "blur(80px)", transform: "translate(30%,-25%)" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, width: 360, height: 360, borderRadius: "50%", background: `${C.orange2}12`, filter: "blur(70px)", transform: "translate(-25%,25%)" }} />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-16 items-center">
          {/* left copy */}
          <motion.div initial={{ opacity: 0, x: -28 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.65 }}>
            {/* badge */}
            <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-6"
              style={{ background: `${C.orange}12`, color: C.orange }}>
              <LaxaSparkle size={11} /> Powered by Palmingo
            </span>

            <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.05 }}
              className="text-4xl md:text-[58px] mb-5">
              Master Any Language,{" "}
              <span style={{ color: C.orange }}>One Word at a Time.</span>
            </h1>

            <p className="text-lg mb-8 max-w-lg leading-relaxed" style={{ color: "#3a3a40" }}>
              Watch YouTube videos, tap any word to save it, practice with Laxa AI — and see your progress grow every day.
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              <Link to="/login"
                style={{ background: C.orange, color: "#fff", boxShadow: `0 8px 28px ${C.orange}3a` }}
                className="inline-flex items-center gap-2 text-sm font-bold px-6 py-3.5 rounded-2xl hover:opacity-90 transition">
                Start Learning Free <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#how"
                style={{ border: "1.5px solid rgba(10,10,15,.13)", color: C.ink }}
                className="inline-flex items-center gap-2 text-sm font-medium px-6 py-3.5 rounded-2xl hover:border-[#FF4D2E] transition">
                See How It Works
              </a>
            </div>

            <div className="flex flex-wrap gap-4 text-sm" style={{ color: C.muted }}>
              {["No credit card required", "12+ languages", "Free forever"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <Check className="w-4 h-4" style={{ color: C.orange }} />{t}
                </span>
              ))}
            </div>
          </motion.div>

          {/* right — floating UI cards */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.65, delay: 0.15 }}
            className="hidden md:flex items-center justify-center">
            <HeroCards />
          </motion.div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid rgba(10,10,15,.07)", borderBottom: "1px solid rgba(10,10,15,.07)", background: "#fafafa" }}>
        <div className="max-w-4xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <FadeIn key={s.label} delay={i * 0.08} className="text-center">
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 30, color: C.orange, letterSpacing: "-0.03em" }}>{s.value}</div>
              <div className="text-sm mt-1" style={{ color: C.muted }}>{s.label}</div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section id="features" className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-14">
          <span className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: C.orange, fontFamily: "'Space Grotesk',sans-serif" }}>Features</span>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, letterSpacing: "-0.03em" }}
            className="text-3xl md:text-4xl mt-2">Everything you need to become fluent</h2>
          <p className="mt-3 max-w-lg mx-auto text-base" style={{ color: "#3a3a40" }}>
            Five powerful tools, one cohesive experience — every minute of practice counts.
          </p>
        </FadeIn>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <FadeIn key={f.title} delay={i * 0.08}
                className="rounded-2xl p-5 hover:shadow-md transition-shadow"
                style={{ background: "#fff", border: "1px solid rgba(10,10,15,.07)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${C.orange}10`, color: C.orange }}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm mb-2" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{f.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "#3a3a40" }}>{f.desc}</p>
              </FadeIn>
            );
          })}
        </div>
      </section>

      {/* ── HOW IT WORKS — Apple-style showcase ─────────────── */}
      <section id="how" className="py-28 overflow-hidden" style={{ background: "#fafafa" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-20">
            <span className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: C.orange, fontFamily: "'Space Grotesk',sans-serif" }}>How It Works</span>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, letterSpacing: "-0.04em" }}
              className="text-3xl md:text-5xl mt-2">Five steps to fluency</h2>
            <p className="mt-4 text-base max-w-md mx-auto" style={{ color: "#5a5a62" }}>
              Every feature works together. One seamless loop from watching to speaking fluently.
            </p>
          </FadeIn>

          <div className="space-y-0">
            {steps.map((step, i) => {
              const isEven = i % 2 === 1;
              return (
                <div key={step.num} className="relative">
                  {/* Connecting line between steps */}
                  {i < steps.length - 1 && (
                    <div style={{
                      position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
                      width: 1, height: 48, background: `linear-gradient(180deg, ${C.orange}30, transparent)`,
                      zIndex: 0
                    }} />
                  )}
                  <div className={`grid md:grid-cols-2 gap-12 items-center py-16 md:py-20 ${isEven ? "md:grid-flow-dense" : ""}`}>
                    {/* Copy side */}
                    <FadeIn delay={0} className={`relative ${isEven ? "md:col-start-2" : ""}`}>
                      {/* Step badge */}
                      <div className="flex items-center gap-3 mb-5">
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%",
                          background: `linear-gradient(135deg, ${C.orange}, #FF6B3D)`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontFamily: "'Space Grotesk',sans-serif",
                          fontWeight: 800, fontSize: 13, flexShrink: 0,
                          boxShadow: `0 4px 16px ${C.orange}40`,
                        }}>{step.num}</div>
                        <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, ${C.orange}30, transparent)` }} />
                      </div>

                      <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, letterSpacing: "-0.03em" }}
                        className="text-2xl md:text-3xl mb-4">{step.title}</h3>
                      <p className="text-base leading-relaxed mb-6" style={{ color: "#4a4a52" }}>{step.desc}</p>

                      <Link to="/login"
                        className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl group transition"
                        style={{ background: `${C.orange}10`, color: C.orange, border: `1px solid ${C.orange}25` }}>
                        Try it now <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </FadeIn>

                    {/* Demo side — with premium frame and glow */}
                    <FadeIn delay={0.14} className={isEven ? "md:col-start-1" : ""}>
                      <div className="relative">
                        {/* Glow blob behind demo */}
                        <div style={{
                          position: "absolute", inset: "-30px",
                          background: `radial-gradient(ellipse 70% 60% at 50% 50%, ${C.orange}12, transparent 70%)`,
                          filter: "blur(20px)",
                          pointerEvents: "none",
                        }} />
                        {/* Demo component */}
                        <div style={{ position: "relative", transform: "perspective(1000px) rotateY(0deg)" }}>
                          <motion.div
                            whileHover={{ scale: 1.015, y: -4 }}
                            transition={{ type: "spring", stiffness: 200, damping: 22 }}
                          >
                            {step.demo}
                          </motion.div>
                        </div>
                      </div>
                    </FadeIn>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────── */}
      <section id="testimonials" className="py-24 max-w-5xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-14">
          <span className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: C.orange, fontFamily: "'Space Grotesk',sans-serif" }}>Reviews</span>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, letterSpacing: "-0.03em" }}
            className="text-3xl md:text-4xl mt-2">Loved by language learners</h2>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <FadeIn key={t.name} delay={i * 0.1}
              className="rounded-3xl p-6"
              style={{ background: "#fff", border: "1px solid rgba(10,10,15,.07)" }}>
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-sm leading-relaxed mb-5" style={{ color: "#3a3a40" }}>"{t.text}"</p>
              <div className="flex items-center gap-3 pt-4" style={{ borderTop: "1px solid rgba(10,10,15,.07)" }}>
                <span className="text-2xl">{t.flag}</span>
                <div>
                  <div className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{t.name}</div>
                  <div className="text-xs" style={{ color: C.muted }}>{t.role}</div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────── */}
      <section className="py-28 relative overflow-hidden" style={{ background: C.ink }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(60% 80% at 50% 50%, ${C.orange}28, transparent 70%)` }} />
        <FadeIn className="relative z-10 text-center max-w-xl mx-auto px-4">
          <div className="flex justify-center mb-6">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              style={{ color: C.orange }}>
              <LaxaSparkle size={52} />
            </motion.div>
          </div>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, letterSpacing: "-0.04em", color: "#fff" }}
            className="text-3xl md:text-5xl mb-4">
            Ready to grow your language?
          </h2>
          <p className="text-base mb-10 max-w-md mx-auto" style={{ color: `${C.orange2}cc` }}>
            Join thousands of learners turning daily practice into real fluency — with Laxa AI by Palmingo.
          </p>
          <Link to="/login"
            className="inline-flex items-center gap-2 text-base font-bold px-8 py-4 rounded-2xl hover:opacity-90 transition"
            style={{ background: C.orange, color: "#fff", boxShadow: `0 16px 48px ${C.orange}40` }}>
            Start for Free <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="mt-6 flex justify-center gap-5 text-sm" style={{ color: `${C.orange2}80` }}>
            <span>✓ No signup fee</span>
            <span>✓ 12+ languages</span>
            <span>✓ Cancel anytime</span>
          </div>
        </FadeIn>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer style={{ background: C.ink, borderTop: "1px solid rgba(255,255,255,.05)" }} className="py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2" style={{ color: "#fff" }}>
              <LaxaSparkle size={18} style={{ color: C.orange }} />
              <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700 }}>Palmingo</span>
            </div>
            <div className="flex flex-wrap gap-6 text-sm" style={{ color: C.muted }}>
              <a href="#features" className="hover:text-white transition">Features</a>
              <a href="#how" className="hover:text-white transition">How It Works</a>
              <a href="#testimonials" className="hover:text-white transition">Reviews</a>
              <Link to="/login" className="hover:text-white transition">Sign In</Link>
            </div>
            <div className="flex items-center gap-1.5 text-sm" style={{ color: C.muted }}>
              <Globe className="w-4 h-4" /><span>12+ languages</span>
            </div>
          </div>
          <div className="mt-8 pt-6 text-center text-xs" style={{ borderTop: "1px solid rgba(255,255,255,.05)", color: "#3a3a40" }}>
            © {new Date().getFullYear()} Palmingo · AI language learning powered by{" "}
            <span style={{ color: C.orange }}>Laxa</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
