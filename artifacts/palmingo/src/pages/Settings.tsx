import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Moon, Sun, Trash2, Info, Check, Globe, BookOpen } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getProgress, saveProgress } from "@/lib/progress";
import { useI18n, APP_LANGUAGES, type LangCode } from "@/lib/i18n";
import { BRAND_ORANGE } from "@/lib/theme";

const LEARNING_LANGUAGES = [
  "English", "Arabic", "French", "Spanish", "German",
  "Italian", "Portuguese", "Japanese", "Chinese", "Russian",
  "Korean", "Turkish", "Dutch", "Swedish", "Greek",
  "Hindi", "Vietnamese", "Indonesian",
];
const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default function Settings() {
  const { user, updateProfile, signOut } = useAuth();
  const { lang, t, setLang } = useI18n();

  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [targetLang, setTargetLang] = useState(user?.targetLang ?? "English");
  const [level, setLevel] = useState(user?.level ?? "A1");
  const [saved, setSaved] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try { localStorage.setItem("palmingo:theme", dark ? "dark" : "light"); } catch {}
  }, [dark]);

  const handleSave = () => {
    updateProfile({ targetLang, level });
    const p = getProgress();
    saveProgress({ ...p, targetLang, level: level as "A1" | "A2" | "B1" | "B2" | "C1" | "C2" });
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  // When user picks an app language — update i18n, nativeLang, and progress all at once
  const handleAppLanguageChange = (code: LangCode, label: string) => {
    setLang(code);
    updateProfile({ nativeLang: label });
    const p = getProgress();
    saveProgress({ ...p, nativeLang: label });
  };

  const clearProgress = () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    localStorage.removeItem("palmingo:progress");
    localStorage.removeItem("palmingo:flashcards");
    localStorage.removeItem("palmingo:decks-v2");
    localStorage.removeItem("palmingo:conversations");
    localStorage.removeItem("palmingo:dict-history");
    window.dispatchEvent(new CustomEvent("palmingo:progress"));
    setConfirmClear(false);
  };

  const Section = ({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) => (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 20, padding: "20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        {icon && <span style={{ color: BRAND_ORANGE }}>{icon}</span>}
        <h2 style={{ fontWeight: 700, fontSize: 15, color: "var(--foreground)", fontFamily: "'Space Grotesk',sans-serif" }}>
          {title}
        </h2>
      </div>
      {children}
    </motion.div>
  );

  const selectStyle: React.CSSProperties = {
    background: "var(--muted)", border: "1px solid var(--border)",
    borderRadius: 12, padding: "10px 14px", fontSize: 14,
    color: "var(--foreground)", outline: "none", width: "100%",
    cursor: "pointer", appearance: "none",
  };

  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }} className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: "clamp(1.4rem,4vw,1.9rem)", fontWeight: 800, color: "var(--foreground)", fontFamily: "'Space Grotesk',sans-serif", letterSpacing: "-0.03em" }}>
          {t("settings")}
        </h1>
        <p style={{ color: "var(--muted-foreground)", fontSize: 13, marginTop: 4 }}>
          {t("app_language_desc")}
        </p>
      </motion.div>

      {/* ── App Language ── */}
      <Section title={t("app_language")} icon={<Globe style={{ width: 17, height: 17 }} />}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {APP_LANGUAGES.map((l) => (
            <button key={l.code} onClick={() => handleAppLanguageChange(l.code as LangCode, l.label)}
              style={{
                padding: "10px 14px", borderRadius: 12, cursor: "pointer",
                border: `1.5px solid ${lang === l.code ? BRAND_ORANGE : "var(--border)"}`,
                background: lang === l.code ? `rgba(255,77,46,0.08)` : "var(--muted)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                transition: "all 0.15s",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", textAlign: "left" }}>
                  {l.native}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted-foreground)", textAlign: "left" }}>
                  {l.label}
                </div>
              </div>
              {lang === l.code && (
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  background: BRAND_ORANGE,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Check style={{ width: 11, height: 11, color: "#fff" }} />
                </div>
              )}
            </button>
          ))}
        </div>
      </Section>

      {/* ── Appearance ── */}
      <Section title={t("appearance")} icon={<Sun style={{ width: 17, height: 17 }} />}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--foreground)" }}>
              {t("dark_mode")}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 }}>
              {dark ? t("dark") : t("light")}
            </div>
          </div>
          <button onClick={() => setDark((d) => !d)}
            style={{
              position: "relative", width: 52, height: 28, borderRadius: 14,
              background: dark ? BRAND_ORANGE : "var(--muted)",
              border: "none", cursor: "pointer", transition: "background 0.25s",
              flexShrink: 0,
            }}
          >
            <motion.div
              animate={{ x: dark ? 24 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              style={{
                position: "absolute", top: 2,
                width: 24, height: 24, borderRadius: "50%",
                background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {dark
                ? <Moon style={{ width: 12, height: 12, color: "#64748b" }} />
                : <Sun style={{ width: 12, height: 12, color: "#f59e0b" }} />
              }
            </motion.div>
          </button>
        </div>
      </Section>

      {/* ── Learning Language ── */}
      <Section title={t("learning_lang")} icon={<BookOpen style={{ width: 17, height: 17 }} />}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)", display: "block", marginBottom: 8 }}>
              Language to Learn
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
              {LEARNING_LANGUAGES.map((l) => (
                <button key={l} onClick={() => setTargetLang(l)}
                  style={{
                    padding: "10px 12px", borderRadius: 12, cursor: "pointer",
                    border: `1.5px solid ${targetLang === l ? BRAND_ORANGE : "var(--border)"}`,
                    background: targetLang === l ? `rgba(255,77,46,0.08)` : "var(--muted)",
                    fontSize: 13, fontWeight: 600,
                    color: targetLang === l ? BRAND_ORANGE : "var(--foreground)",
                    transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}
                >
                  {l}
                  {targetLang === l && <Check style={{ width: 13, height: 13 }} />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)", display: "block", marginBottom: 8 }}>
              CEFR Level
            </label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {CEFR_LEVELS.map((lv) => (
                <button key={lv} onClick={() => setLevel(lv)}
                  style={{
                    flex: 1, minWidth: 44, padding: "9px 4px", borderRadius: 10,
                    fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none",
                    background: level === lv ? `linear-gradient(135deg,${BRAND_ORANGE},#FF6B3D)` : "var(--muted)",
                    color: level === lv ? "#fff" : "var(--muted-foreground)",
                    transition: "all 0.15s",
                    boxShadow: level === lv ? `0 3px 10px rgba(255,77,46,0.3)` : "none",
                  }}
                >
                  {lv}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleSave}
            style={{
              width: "100%", padding: "12px", borderRadius: 14, border: "none",
              cursor: "pointer", fontSize: 14, fontWeight: 700,
              fontFamily: "'Space Grotesk',sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "all 0.2s",
              background: saved
                ? "rgba(34,197,94,0.12)"
                : `linear-gradient(135deg,${BRAND_ORANGE},#FF6B3D)`,
              color: saved ? "#16a34a" : "#fff",
              boxShadow: saved ? "none" : `0 4px 14px rgba(255,77,46,0.3)`,
            }}
          >
            {saved ? <><Check style={{ width: 16, height: 16 }} />{t("saved")}</> : t("save_settings")}
          </button>
        </div>
      </Section>

      {/* ── Account ── */}
      <Section title="👤 Account">
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--muted)", borderRadius: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
            background: `linear-gradient(135deg,${BRAND_ORANGE},#FF6B3D)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 800, fontSize: 16, fontFamily: "'Space Grotesk',sans-serif",
          }}>
            {(user?.name ?? "?").slice(0, 1).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: "var(--foreground)" }}>{user?.name}</div>
            <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{user?.email}</div>
          </div>
        </div>
        <button onClick={() => { signOut(); }}
          style={{
            width: "100%", marginTop: 12, padding: "10px", borderRadius: 12, cursor: "pointer",
            fontSize: 13, fontWeight: 600, border: "1px solid var(--border)",
            background: "transparent", color: "var(--foreground)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          {t("sign_out")}
        </button>
      </Section>

      {/* ── Data Management ── */}
      <Section title="🗑️ Data Management">
        <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 14, lineHeight: 1.5 }}>
          Clearing progress removes all XP, streaks, flashcard data, and conversation history. Cannot be undone.
        </p>
        <button onClick={clearProgress}
          style={{
            width: "100%", padding: "11px", borderRadius: 12, cursor: "pointer",
            fontSize: 13, fontWeight: 600,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            transition: "all 0.18s",
            background: confirmClear ? "rgba(239,68,68,0.9)" : "transparent",
            color: confirmClear ? "#fff" : "#ef4444",
            border: "1px solid rgba(239,68,68,0.4)",
          }}
        >
          <Trash2 style={{ width: 14, height: 14 }} />
          {confirmClear ? "Tap again to confirm — cannot be undone" : "Clear All Progress"}
        </button>
      </Section>

      {/* About */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 18, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}
      >
        <Info style={{ width: 18, height: 18, color: "var(--muted-foreground)", flexShrink: 0 }} />
        <div style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.6 }}>
          <strong>Palmingo v2.0</strong> · AI-powered language learning.<br />
          Powered by Gemini 2.0 Flash · Spaced repetition via SM-2 algorithm.
        </div>
      </motion.div>
    </div>
  );
}
