import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ── shared phase-loop hook ─────────────────────────────── */
function usePhaseLoop(stepDelaysMs: number[]) {
  const [phase, setPhase] = useState(0);
  const [iter, setIter] = useState(0);
  useEffect(() => {
    setPhase(0);
    const timers = stepDelaysMs.map((d, i) => setTimeout(() => setPhase(i + 1), d));
    const reset = setTimeout(() => setIter((n) => n + 1), stepDelaysMs[stepDelaysMs.length - 1] + 2000);
    return () => { timers.forEach(clearTimeout); clearTimeout(reset); };
  }, [iter]); // eslint-disable-line react-hooks/exhaustive-deps
  return phase;
}

/* ── Laxa sparkle ───────────────────────────────────────── */
function Spark({ size = 12, color = "#FF4D2E" }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} style={{ color }} fill="currentColor" aria-hidden="true">
      <path d="M100 8 C 104 60,140 96,192 100 C 140 104,104 140,100 192 C 96 140,60 104,8 100 C 60 96,96 60,100 8 Z" />
    </svg>
  );
}

/* ── Premium macOS-style browser frame ───────────────────── */
function BrowserFrame({ children, url = "app.palmingo.ai" }: { children: React.ReactNode; url?: string }) {
  return (
    <div style={{
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "0 32px 80px rgba(10,10,30,.18), 0 8px 24px rgba(0,0,0,.08), 0 0 0 1px rgba(10,10,15,.06)",
      userSelect: "none",
      background: "#ffffff",
    }}>
      {/* macOS chrome bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 0,
        padding: "10px 14px",
        background: "linear-gradient(180deg, #f5f4f2, #eeece9)",
        borderBottom: "1px solid rgba(10,10,15,.1)",
        position: "relative",
      }}>
        {/* Traffic light dots */}
        <div style={{ display: "flex", gap: 5.5, marginRight: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57", boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.15)" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e", boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.15)" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840", boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.15)" }} />
        </div>

        {/* URL bar — centered */}
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          background: "rgba(255,255,255,0.85)",
          borderRadius: 7, padding: "3.5px 10px",
          border: "1px solid rgba(10,10,15,.08)",
          maxWidth: 220, margin: "0 auto",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,.05)"
        }}>
          <Spark size={8} color="#FF4D2E" />
          <span style={{ fontSize: 9.5, color: "#444", fontWeight: 500, letterSpacing: "0.01em" }}>{url}</span>
        </div>

        {/* right spacer to balance layout */}
        <div style={{ width: 55 }} />
      </div>
      {/* App content */}
      <div style={{ position: "relative", background: "#ffffff", overflow: "hidden", height: 295 }}>
        {children}
      </div>
    </div>
  );
}

/* ── shared token set — light mode with orange accents ───── */
const T = {
  accent:     "#FF4D2E",
  accent2:    "#FFB37A",
  ink:        "#0A0A0F",
  muted:      "#7a7a82",
  bg:         "#ffffff",
  card:       { background: "#f8f7f5", border: "1px solid rgba(10,10,15,.07)", borderRadius: 14 },
  pillBg:     "rgba(255,77,46,.1)",
  pillColor:  "#FF4D2E",
};

/* ══════════════════════════════════════════════════════════
   DEMO 1 — Laxa AI Tutor
══════════════════════════════════════════════════════════ */
export function TutorDemo() {
  const phase = usePhaseLoop([1200, 2800, 4400, 6000]);

  return (
    <BrowserFrame>
      {/* top bar */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(10,10,15,.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Spark size={13} color={T.accent} />
          <span style={{ color: T.ink, fontSize: 11, fontWeight: 700 }}>Laxa AI Tutor</span>
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {["🇫🇷 French", "A1", "☕ Café"].map((p) => (
            <span key={p} style={{ background: T.pillBg, color: T.pillColor, borderRadius: 100, padding: "2px 8px", fontSize: 9, fontWeight: 600 }}>{p}</span>
          ))}
        </div>
      </div>

      {/* chat messages */}
      <div style={{ padding: "12px 14px", height: 200, overflow: "hidden", position: "relative" }}>
        {/* Laxa opening */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ display: "flex", gap: 7, marginBottom: 10, alignItems: "flex-start" }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
            <Spark size={11} color="#fff" />
          </div>
          <div style={{ ...T.card, padding: "8px 11px", fontSize: 10, color: T.ink, lineHeight: 1.6, maxWidth: "82%" }}>
            Bonjour! You're at a Parisian café. What would you like to order?
            <div style={{ fontSize: 9, color: T.muted, marginTop: 3 }}>Your turn — tell me your order!</div>
          </div>
        </motion.div>

        <AnimatePresence>
          {phase >= 1 && (
            <motion.div key="user" initial={{ opacity: 0, y: 10, x: 20 }} animate={{ opacity: 1, y: 0, x: 0 }}
              style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
              <div style={{ background: T.accent, borderRadius: "14px 14px 3px 14px", padding: "7px 12px", fontSize: 10, color: "#fff", maxWidth: "72%" }}>
                I want go to the café please
              </div>
            </motion.div>
          )}

          {phase === 2 && (
            <motion.div key="dots" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: "flex", gap: 4, padding: "4px 0", alignItems: "center", marginBottom: 8, marginLeft: 29 }}>
              {[0, 1, 2].map((i) => (
                <motion.div key={i} animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.5, delay: i * 0.15, repeat: Infinity }}
                  style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent }} />
              ))}
            </motion.div>
          )}

          {phase >= 3 && (
            <motion.div key="reply" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Spark size={11} color="#fff" />
              </div>
              <div style={{ ...T.card, padding: "8px 11px", fontSize: 10, color: T.ink, lineHeight: 1.6, maxWidth: "84%" }}>
                Bien sûr! À quelle heure souhaitez-vous y aller?
                <div style={{ marginTop: 5, background: "#fff7f5", border: `1px solid ${T.accent}22`, borderRadius: 7, padding: "4px 8px", fontSize: 9 }}>
                  ✏️ <span style={{ textDecoration: "line-through", color: "#f87171" }}>want go</span>
                  <span style={{ color: T.muted }}> → </span>
                  <span style={{ color: "#16a34a", fontWeight: 700 }}>want to go</span>
                  <span style={{ color: T.muted }}> (missing infinitive)</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* voice wave */}
        <AnimatePresence>
          {phase >= 4 && (
            <motion.div key="wave" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ position: "absolute", bottom: 4, left: 12, right: 12, background: "#fff5f3", border: `1px solid ${T.accent}22`, borderRadius: 12, padding: "8px 10px" }}>
              <div style={{ fontSize: 9, color: T.accent, marginBottom: 4, fontWeight: 600 }}>🎤 Speaking…</div>
              <div style={{ display: "flex", alignItems: "center", gap: 2, height: 20 }}>
                {Array.from({ length: 22 }, (_, i) => (
                  <motion.div key={i}
                    animate={{ scaleY: [0.2, 0.7 + (i % 3) * 0.25, 0.2] }}
                    transition={{ duration: 0.4 + (i % 4) * 0.08, delay: i * 0.03, repeat: Infinity }}
                    style={{ flex: 1, background: T.accent, borderRadius: 2, height: "100%", transformOrigin: "center" }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* input bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px 12px", borderTop: "1px solid rgba(10,10,15,.06)", display: "flex", gap: 8, alignItems: "center", background: "#fff" }}>
        <div style={{ flex: 1, background: "#f5f4f2", borderRadius: 100, padding: "5px 12px", fontSize: 9, color: T.muted }}>
          Type or press the mic…
        </div>
        <div style={{ width: 26, height: 26, borderRadius: "50%", background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>🎤</div>
      </div>
    </BrowserFrame>
  );
}

/* ══════════════════════════════════════════════════════════
   DEMO 2 — Video Hub
══════════════════════════════════════════════════════════ */
export function VideoDemo() {
  const phase = usePhaseLoop([1500, 3000, 5000]);
  const words = ["The", "most", "beautiful", "cities", "in", "France"];

  return (
    <BrowserFrame>
      {/* video player */}
      <div style={{ height: 120, background: "linear-gradient(135deg,#1a1f2e 0%,#0d1117 100%)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid rgba(255,255,255,.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 0, height: 0, borderTop: "7px solid transparent", borderBottom: "7px solid transparent", borderLeft: "13px solid rgba(255,255,255,.85)", marginLeft: 3 }} />
        </div>
        {/* progress bar */}
        <div style={{ position: "absolute", bottom: 8, left: 12, right: 12 }}>
          <div style={{ height: 2.5, background: "rgba(255,255,255,.15)", borderRadius: 2, overflow: "hidden" }}>
            <motion.div animate={{ width: ["0%", "55%"] }} transition={{ duration: 7, repeat: Infinity }}
              style={{ height: "100%", background: T.accent }} />
          </div>
        </div>
        <div style={{ position: "absolute", top: 8, right: 10, fontSize: 9, color: "rgba(255,255,255,.65)", background: "rgba(255,77,46,.3)", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>CC</div>
      </div>

      {/* subtitle words */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(10,10,15,.06)", background: "#fafafa" }}>
        <div style={{ fontSize: 12, display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
          {words.map((w, i) => (
            <motion.span key={i}
              animate={{
                background: (phase >= 1 && w === "beautiful") ? T.accent + "18" : "transparent",
                color: (phase >= 1 && w === "beautiful") ? T.accent : T.ink,
              }}
              style={{ borderRadius: 5, padding: "1px 4px", cursor: "pointer", fontWeight: w === "beautiful" ? 700 : 400, transition: "color .3s" }}
            >{w}</motion.span>
          ))}
        </div>
      </div>

      {/* tap popup */}
      <AnimatePresence>
        {phase >= 2 && (
          <motion.div key="popup" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ ...T.card, margin: "10px 14px", padding: "10px 12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div>
                <div style={{ color: T.ink, fontWeight: 700, fontSize: 13 }}>beautiful</div>
                <div style={{ color: T.muted, fontSize: 9, fontFamily: "monospace" }}>/ˈbjuːtɪfʊl/</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: T.accent, fontWeight: 700, fontSize: 12 }}>جميل</div>
                <div style={{ color: T.muted, fontSize: 9 }}>Arabic · adj</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["🔊 Pronounce", "+ Save Card"].map((btn, i) => (
                <motion.div key={btn}
                  animate={phase >= 3 && i === 1 ? { scale: [1, 1.04, 1], background: [T.accent, "#E03B1B", T.accent] } : {}}
                  transition={{ duration: 0.9, repeat: Infinity }}
                  style={{ flex: 1, textAlign: "center", padding: "5px 0", borderRadius: 8, fontSize: 9, color: i === 0 ? T.ink : "#fff", background: i === 0 ? "#f0eeeb" : T.accent, fontWeight: 600, cursor: "pointer" }}
                >{btn}{phase >= 3 && i === 1 ? " ✨" : ""}</motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </BrowserFrame>
  );
}

/* ══════════════════════════════════════════════════════════
   DEMO 3 — Smart Flashcards
══════════════════════════════════════════════════════════ */
export function FlashcardsDemo() {
  const phase = usePhaseLoop([1000, 2500, 4000, 5800]);

  return (
    <BrowserFrame>
      <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(10,10,15,.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13 }}>🗂</span>
          <span style={{ color: T.ink, fontSize: 11, fontWeight: 700 }}>Smart Flashcards</span>
        </div>
        <span style={{ background: T.pillBg, color: T.pillColor, borderRadius: 100, padding: "2px 8px", fontSize: 9, fontWeight: 700 }}>12 due today</span>
      </div>

      <div style={{ padding: "16px 14px", display: "flex", flexDirection: "column", alignItems: "center", height: 240 }}>
        {/* card */}
        <motion.div
          animate={{ rotateY: phase >= 2 ? 180 : 0 }}
          transition={{ duration: 0.6, ease: [0.25,0.1,0.25,1] }}
          style={{ width: "100%", maxWidth: 260, perspective: 1000, transformStyle: "preserve-3d", position: "relative", height: 130, marginBottom: 14 }}
        >
          {/* front */}
          <motion.div style={{
            position: "absolute", inset: 0, borderRadius: 16, backfaceVisibility: "hidden",
            background: "#fff", border: `1.5px solid ${T.accent}22`,
            boxShadow: `0 8px 24px ${T.accent}15`,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.ink, letterSpacing: "-0.03em" }}>ephemeral</div>
            <div style={{ fontSize: 10, color: T.muted, fontFamily: "monospace", marginTop: 4 }}>/ɪˈfɛm(ə)r(ə)l/</div>
            <div style={{ fontSize: 9, color: T.accent, marginTop: 8, fontWeight: 600 }}>Tap to reveal ✦</div>
          </motion.div>
          {/* back */}
          <motion.div style={{
            position: "absolute", inset: 0, borderRadius: 16, backfaceVisibility: "hidden",
            rotateY: 180,
            background: `linear-gradient(135deg, ${T.accent} 0%, #FF6B3D 100%)`,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff"
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>زائل · عابر</div>
            <div style={{ fontSize: 9, marginTop: 6, opacity: 0.85, maxWidth: 200, textAlign: "center" }}>Lasting a very short time. "ephemeral pleasures"</div>
          </motion.div>
        </motion.div>

        {/* progress dots */}
        <div style={{ display: "flex", gap: 5, marginBottom: 12 }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i === 1 ? T.accent : "rgba(10,10,15,.12)" }} />
          ))}
        </div>

        {/* rating buttons */}
        <AnimatePresence>
          {phase >= 2 && (
            <motion.div key="btns" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", gap: 8, width: "100%", maxWidth: 260 }}>
              {[
                { label: "Again", bg: "#fef2f2", color: "#ef4444" },
                { label: "Hard",  bg: "#fffbeb", color: "#f59e0b" },
                { label: "Good",  bg: "#f0fdf4", color: "#16a34a" },
                { label: "Easy",  bg: T.pillBg,  color: T.accent },
              ].map(({ label, bg, color }, i) => (
                <motion.div key={label}
                  animate={phase >= 3 && label === "Good" ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.6, repeat: 2 }}
                  style={{ flex: 1, textAlign: "center", padding: "6px 0", borderRadius: 9, fontSize: 9, color, background: bg, fontWeight: 700, cursor: "pointer" }}
                >{label}</motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* XP reward */}
        <AnimatePresence>
          {phase >= 4 && (
            <motion.div key="xp" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              style={{ marginTop: 8, background: T.pillBg, borderRadius: 100, padding: "4px 12px", fontSize: 10, color: T.accent, fontWeight: 700 }}>
              +10 XP 🌴 Card mastered!
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BrowserFrame>
  );
}

/* ══════════════════════════════════════════════════════════
   DEMO 4 — Smart Dictionary
══════════════════════════════════════════════════════════ */
const TYPED_WORD = "serendipity";

export function DictionaryDemo() {
  const phase = usePhaseLoop([1600, 3200, 5200]);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (phase === 1) {
      setCharCount(0);
      let c = 0;
      const t = setInterval(() => { c++; setCharCount(c); if (c >= TYPED_WORD.length) clearInterval(t); }, 110);
      return () => clearInterval(t);
    }
    return undefined;
  }, [phase]);

  return (
    <BrowserFrame>
      <div style={{ padding: "10px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: 12 }}>📖</span>
          <span style={{ color: T.ink, fontSize: 11, fontWeight: 700 }}>Smart Dictionary</span>
        </div>

        {/* search bar */}
        <div style={{ background: "#f8f7f5", borderRadius: 10, padding: "7px 12px", display: "flex", alignItems: "center", gap: 8, marginBottom: 10, border: `1px solid rgba(10,10,15,.08)` }}>
          <span style={{ fontSize: 11 }}>🔍</span>
          <span style={{ fontSize: 11, color: phase >= 1 ? T.ink : T.muted, fontFamily: "monospace" }}>
            {phase >= 1 ? TYPED_WORD.slice(0, charCount) : "Search any word…"}
            {phase === 1 && charCount < TYPED_WORD.length && (
              <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.65, repeat: Infinity }}
                style={{ display: "inline-block", width: 1.5, height: 11, background: T.accent, marginLeft: 1, verticalAlign: "text-bottom" }} />
            )}
          </span>
        </div>

        <AnimatePresence>
          {phase >= 2 && (
            <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ ...T.card, padding: "12px 13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 7 }}>
                <div>
                  <div style={{ color: T.ink, fontWeight: 800, fontSize: 14, letterSpacing: "-0.02em" }}>serendipity</div>
                  <div style={{ color: T.muted, fontSize: 9, fontFamily: "monospace" }}>/ˌsɛrənˈdɪpɪti/</div>
                </div>
                <div style={{ background: T.pillBg, borderRadius: 7, padding: "3px 9px", fontSize: 9, color: T.accent, fontWeight: 700 }}>noun</div>
              </div>
              <div style={{ color: T.accent, fontSize: 12, fontWeight: 700, marginBottom: 5 }}>مصادفة سعيدة</div>
              <div style={{ color: T.muted, fontSize: 9, lineHeight: 1.6, marginBottom: 10 }}>
                Finding something good by chance. <em>"a serendipitous meeting"</em>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["🔊 Pronounce", "+ Flashcard"].map((b, i) => (
                  <motion.div key={b}
                    animate={phase >= 3 && i === 1 ? { scale: [1, 1.05, 1], background: [T.accent, "#E03B1B", T.accent] } : {}}
                    transition={{ duration: 0.9, repeat: Infinity }}
                    style={{ flex: 1, textAlign: "center", padding: "5px 0", borderRadius: 8, fontSize: 9, color: i === 0 ? T.ink : "#fff", background: i === 0 ? "#f0eeeb" : T.accent, fontWeight: 600 }}
                  >{b}</motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BrowserFrame>
  );
}

/* ══════════════════════════════════════════════════════════
   DEMO 5 — Progress & Palm Growth
══════════════════════════════════════════════════════════ */
export function ProgressDemo() {
  const phase = usePhaseLoop([800, 1800, 3200, 5000]);

  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const bars  = [0.45, 0.7, 0.55, 0.9, 0.65, 0.4, 0.8];

  return (
    <BrowserFrame>
      <div style={{ padding: "10px 14px" }}>
        {/* header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12 }}>🌴</span>
            <span style={{ color: T.ink, fontSize: 11, fontWeight: 700 }}>Your Progress</span>
          </div>
          <span style={{ background: "#fff5f3", border: `1px solid ${T.accent}22`, color: T.accent, borderRadius: 100, padding: "2px 8px", fontSize: 9, fontWeight: 700 }}>
            🔥 7 day streak
          </span>
        </div>

        {/* XP stat row */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {[
            { label: "XP", value: "1,240", icon: "⚡" },
            { label: "Words", value: "347", icon: "📝" },
            { label: "Level", value: "B1", icon: "🎯" },
          ].map(({ label, value, icon }, i) => (
            <motion.div key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              transition={{ delay: i * 0.12 }}
              style={{ flex: 1, background: "#f8f7f5", borderRadius: 10, padding: "7px 8px", textAlign: "center", border: "1px solid rgba(10,10,15,.06)" }}
            >
              <div style={{ fontSize: 12 }}>{icon}</div>
              <div style={{ color: T.accent, fontWeight: 800, fontSize: 12, letterSpacing: "-0.02em" }}>{value}</div>
              <div style={{ color: T.muted, fontSize: 8 }}>{label}</div>
            </motion.div>
          ))}
        </div>

        {/* XP bar */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: T.muted, marginBottom: 4 }}>
            <span>B1 progress</span><span>1,240 / 2,000 XP</span>
          </div>
          <div style={{ height: 6, background: "#f0eeeb", borderRadius: 100, overflow: "hidden" }}>
            <motion.div
              animate={phase >= 2 ? { width: "62%" } : { width: "0%" }}
              transition={{ duration: 1.2, ease: [0.25,0.1,0.25,1] }}
              style={{ height: "100%", background: `linear-gradient(90deg,${T.accent},${T.accent2})`, borderRadius: 100 }}
            />
          </div>
        </div>

        {/* weekly bar chart */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 8, color: T.muted, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>This week</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 44 }}>
            {days.map((d, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <motion.div
                  animate={phase >= 3 ? { height: `${bars[i] * 100}%`, opacity: 1 } : { height: "4px", opacity: 0.4 }}
                  transition={{ duration: 0.7, delay: i * 0.07, ease: [0.25,0.1,0.25,1] }}
                  style={{ width: "100%", borderRadius: 3, background: i === 6 ? T.accent : `${T.accent}55` }}
                />
                <span style={{ fontSize: 7, color: i === 6 ? T.accent : T.muted, fontWeight: i === 6 ? 700 : 400 }}>{d}</span>
              </div>
            ))}
          </div>
        </div>

        {/* level up badge */}
        <AnimatePresence>
          {phase >= 4 && (
            <motion.div key="lvl" initial={{ opacity: 0, scale: 0.85, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              style={{ background: `linear-gradient(90deg,${T.accent},${T.accent2})`, borderRadius: 10, padding: "6px 10px", display: "flex", alignItems: "center", gap: 6 }}>
              <Spark size={12} color="#fff" />
              <span style={{ color: "#fff", fontSize: 9, fontWeight: 700 }}>You're 760 XP away from B2! Keep going 🔥</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BrowserFrame>
  );
}
