import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { ChevronRight, ChevronLeft, Check, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { PalmLogo } from "@/components/Logo";

const ORANGE = "#FF4D2E";

const LANGUAGES = [
  "Arabic", "English", "French", "Spanish", "German", "Italian",
  "Portuguese", "Russian", "Chinese", "Japanese", "Korean", "Turkish",
  "Dutch", "Polish", "Swedish", "Greek", "Hebrew", "Persian",
  "Hindi", "Urdu", "Vietnamese", "Thai", "Indonesian",
];

const COUNTRIES = [
  "Egypt", "Saudi Arabia", "UAE", "Kuwait", "Jordan", "Lebanon",
  "Morocco", "Tunisia", "Algeria", "Iraq", "Qatar", "Bahrain",
  "Oman", "Sudan", "Libya", "Yemen", "Syria", "Palestine",
  "USA", "UK", "France", "Germany", "Spain", "Italy",
  "Canada", "Australia", "Russia", "China", "Japan", "India",
  "Brazil", "Turkey", "Iran", "Pakistan", "Nigeria", "Kenya",
];

const GOALS = [
  { id: "travel",      label: "Travel & Tourism",   emoji: "✈️" },
  { id: "business",   label: "Business & Work",      emoji: "💼" },
  { id: "academic",   label: "Academic Study",        emoji: "🎓" },
  { id: "social",     label: "Relationships",         emoji: "👥" },
  { id: "culture",    label: "Culture",               emoji: "🌍" },
  { id: "media",      label: "Media & Entertainment", emoji: "🎬" },
  { id: "immigration",label: "Immigration",           emoji: "🏠" },
  { id: "general",    label: "General Improvement",   emoji: "📈" },
];

const LEVELS = [
  { id: "A1", label: "Beginner",           desc: "I know a few words" },
  { id: "A2", label: "Elementary",         desc: "Basic phrases and sentences" },
  { id: "B1", label: "Intermediate",       desc: "Can hold simple conversations" },
  { id: "B2", label: "Upper Intermediate", desc: "Fairly fluent day-to-day" },
  { id: "C1", label: "Advanced",           desc: "Complex language, near-fluent" },
  { id: "C2", label: "Mastery",            desc: "Native-like proficiency" },
];

interface FormData {
  username: string;
  age: string;
  country: string;
  nativeLang: string;
  targetLang: string;
  goal: string;
  level: string;
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -30 : 30, opacity: 0 }),
};

/* Shared input style — adapts to dark/light via CSS vars */
const inputStyle = (focused = false): React.CSSProperties => ({
  width: "100%",
  borderRadius: 12,
  border: `1px solid ${focused ? ORANGE : "var(--border)"}`,
  boxShadow: focused ? `0 0 0 3px ${ORANGE}18` : "none",
  background: "var(--background)",
  color: "var(--foreground)",
  padding: "11px 14px",
  fontSize: 14,
  outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
  fontFamily: "Inter, sans-serif",
  appearance: "none",
});

export default function Onboarding() {
  const { user, updateProfile } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [data, setData] = useState<FormData>({
    username: "", age: "", country: "",
    nativeLang: "", targetLang: "",
    goal: "", level: "",
  });

  const set = (k: keyof FormData, v: string) => {
    setData((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validateStep = () => {
    const e: Partial<FormData> = {};
    if (step === 0) {
      if (!data.username.trim() || data.username.length < 3) e.username = "At least 3 characters";
      if (!data.age || Number(data.age) < 5 || Number(data.age) > 100) e.age = "Enter a valid age";
      if (!data.country) e.country = "Select your country";
    }
    if (step === 1) {
      if (!data.nativeLang) e.nativeLang = "Select your native language";
      if (!data.targetLang) e.targetLang = "Select a language to learn";
      if (data.nativeLang === data.targetLang) e.targetLang = "Must be different from native language";
    }
    if (step === 2) {
      if (!data.goal) e.goal = "Pick a goal";
      if (!data.level) e.level = "Pick your current level";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validateStep()) return;
    if (step < 2) { setDir(1); setStep((s) => s + 1); }
    else finish();
  };
  const back = () => { setDir(-1); setStep((s) => s - 1); };
  const finish = () => {
    updateProfile({
      username: data.username.replace(/^@/, ""),
      age: Number(data.age),
      country: data.country,
      nativeLang: data.nativeLang,
      targetLang: data.targetLang,
      goal: data.goal,
      level: data.level,
      onboardingComplete: true,
    });
    navigate("/home", { replace: true });
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 600,
    color: "var(--muted-foreground)", marginBottom: 6,
    letterSpacing: "0.08em", textTransform: "uppercase",
  };
  const errStyle: React.CSSProperties = { fontSize: 11, color: "#dc2626", marginTop: 4 };

  const STEPS = [
    {
      title: "Tell us about yourself",
      subtitle: "We'll personalise your learning experience",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Username</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)", fontSize: 14 }}>@</span>
              <input
                style={{ ...inputStyle(focusedField === "username"), paddingLeft: 28 }}
                placeholder="your_username"
                value={data.username}
                onChange={(e) => set("username", e.target.value.toLowerCase().replace(/\s/g, "_"))}
                onFocus={() => setFocusedField("username")}
                onBlur={() => setFocusedField(null)}
              />
            </div>
            {errors.username && <p style={errStyle}>{errors.username}</p>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Age</label>
              <input
                style={inputStyle(focusedField === "age")}
                type="number" min={5} max={100} placeholder="25"
                value={data.age}
                onChange={(e) => set("age", e.target.value)}
                onFocus={() => setFocusedField("age")}
                onBlur={() => setFocusedField(null)}
              />
              {errors.age && <p style={errStyle}>{errors.age}</p>}
            </div>
            <div>
              <label style={labelStyle}>Country</label>
              <select
                style={inputStyle(focusedField === "country")}
                value={data.country}
                onChange={(e) => set("country", e.target.value)}
                onFocus={() => setFocusedField("country")}
                onBlur={() => setFocusedField(null)}
              >
                <option value="">Select…</option>
                {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              {errors.country && <p style={errStyle}>{errors.country}</p>}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Your languages",
      subtitle: "What do you speak, and what do you want to learn?",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Native language</label>
            <select
              style={inputStyle(focusedField === "nativeLang")}
              value={data.nativeLang}
              onChange={(e) => set("nativeLang", e.target.value)}
              onFocus={() => setFocusedField("nativeLang")}
              onBlur={() => setFocusedField(null)}
            >
              <option value="">Select your mother tongue…</option>
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
            {errors.nativeLang && <p style={errStyle}>{errors.nativeLang}</p>}
          </div>
          <div>
            <label style={labelStyle}>Language to learn</label>
            <select
              style={inputStyle(focusedField === "targetLang")}
              value={data.targetLang}
              onChange={(e) => set("targetLang", e.target.value)}
              onFocus={() => setFocusedField("targetLang")}
              onBlur={() => setFocusedField(null)}
            >
              <option value="">Select target language…</option>
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
            {errors.targetLang && <p style={errStyle}>{errors.targetLang}</p>}
          </div>
          {data.nativeLang && data.targetLang && data.nativeLang !== data.targetLang && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                background: `${ORANGE}10`, color: ORANGE,
                borderRadius: 10, padding: "10px 14px", fontSize: 13,
                border: `1px solid ${ORANGE}25`,
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <Check style={{ width: 14, height: 14 }} />
              {data.nativeLang} → {data.targetLang}
            </motion.div>
          )}
        </div>
      ),
    },
    {
      title: "Your goal & level",
      subtitle: "Helps us tailor your Laxa AI content",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Why are you learning?</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {GOALS.map((g) => (
                <button key={g.id} onClick={() => set("goal", g.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 12px", borderRadius: 12,
                    border: `1px solid ${data.goal === g.id ? ORANGE : "var(--border)"}`,
                    background: data.goal === g.id ? `${ORANGE}10` : "var(--background)",
                    color: data.goal === g.id ? ORANGE : "var(--foreground)",
                    fontWeight: data.goal === g.id ? 600 : 400,
                    fontSize: 12, cursor: "pointer",
                    transition: "all 0.2s",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 15 }}>{g.emoji}</span>
                  <span style={{ lineHeight: 1.3 }}>{g.label}</span>
                </button>
              ))}
            </div>
            {errors.goal && <p style={errStyle}>{errors.goal}</p>}
          </div>
          <div>
            <label style={labelStyle}>Current level</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {LEVELS.map((lv) => (
                <button key={lv.id} onClick={() => set("level", lv.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px", borderRadius: 12,
                    border: `1px solid ${data.level === lv.id ? ORANGE : "var(--border)"}`,
                    background: data.level === lv.id ? `${ORANGE}08` : "var(--background)",
                    cursor: "pointer", transition: "all 0.2s", textAlign: "left",
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800,
                    background: data.level === lv.id ? ORANGE : "var(--secondary)",
                    color: data.level === lv.id ? "#fff" : "var(--muted-foreground)",
                    fontFamily: "'Space Grotesk', sans-serif",
                    transition: "all 0.2s",
                  }}>{lv.id}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{lv.label}</div>
                    <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{lv.desc}</div>
                  </div>
                  {data.level === lv.id && <Check style={{ width: 14, height: 14, color: ORANGE, marginLeft: "auto" }} />}
                </button>
              ))}
            </div>
            {errors.level && <p style={errStyle}>{errors.level}</p>}
          </div>
        </div>
      ),
    },
  ];

  return (
    /* Full viewport — no AppShell nav, 100vh */
    <div style={{
      minHeight: "100vh", background: "var(--background)",
      display: "flex", flexDirection: "column",
      alignItems: "center", padding: "16px 16px 32px",
      position: "relative",
    }}>
      {/* Back button for step > 0 or to go home */}
      <div style={{
        width: "100%", maxWidth: 480,
        display: "flex", alignItems: "center", paddingTop: 8, paddingBottom: 8, marginBottom: 8,
      }}>
        {step > 0 ? (
          <button onClick={back}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "none", border: "none", cursor: "pointer",
              color: "var(--muted-foreground)", fontSize: 13, fontWeight: 500, padding: 0,
            }}
          >
            <ArrowLeft style={{ width: 15, height: 15 }} /> Back
          </button>
        ) : (
          <div style={{ height: 36 }} />
        )}
      </div>

      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* Logo + headline */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          <PalmLogo size={38} showWord={false} />
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
            fontSize: 20, letterSpacing: "-0.03em", marginTop: 10,
            color: "var(--foreground)",
          }}>
            Quick setup
          </div>
          <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 2 }}>
            About 60 seconds, {user?.name?.split(" ")[0]}!
          </div>
        </div>

        {/* Progress bar — orange */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 99,
              background: "var(--secondary)", overflow: "hidden",
            }}>
              <motion.div
                animate={{ width: i <= step ? "100%" : "0%" }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                style={{ height: "100%", background: ORANGE, borderRadius: 99 }}
              />
            </div>
          ))}
        </div>

        {/* Step indicator */}
        <div style={{
          fontSize: 11, fontWeight: 600, color: ORANGE,
          letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4,
        }}>
          Step {step + 1} of {STEPS.length}
        </div>

        {/* Card */}
        <div style={{
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: 20, overflow: "hidden",
          backdropFilter: "blur(20px)",
        }}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              style={{ padding: 28 }}
            >
              <h2 style={{
                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
                fontSize: 20, letterSpacing: "-0.02em", marginBottom: 4,
                color: "var(--foreground)",
              }}>
                {STEPS[step].title}
              </h2>
              <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 20 }}>
                {STEPS[step].subtitle}
              </p>
              {STEPS[step].content}
            </motion.div>
          </AnimatePresence>

          {/* Action button */}
          <div style={{ padding: "0 28px 28px" }}>
            <button onClick={next}
              style={{
                width: "100%", padding: "14px 20px",
                borderRadius: 14, border: "none",
                background: `linear-gradient(135deg, ${ORANGE}, #FF6B3D)`,
                color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 8,
                fontFamily: "'Space Grotesk', sans-serif",
                boxShadow: `0 6px 20px ${ORANGE}35`,
                transition: "all 0.2s",
              }}
            >
              {step < 2 ? (
                <>Next <ChevronRight style={{ width: 15, height: 15 }} /></>
              ) : (
                <>Start Learning 🌴</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
