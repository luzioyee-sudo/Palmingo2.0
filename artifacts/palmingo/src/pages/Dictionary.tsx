import { useState } from "react";
import { Search, Volume2, Loader2, Sparkles, BookOpen, Clock, X, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { speak } from "@/lib/speech";
import { addXp, getProgress } from "@/lib/progress";
import { useI18n } from "@/lib/i18n";
import { BRAND_ORANGE } from "@/lib/theme";

type Sentence = { level: string; en: string; native: string };

type DictResult = {
  word: string;
  ipa: string;
  translation: string;
  meaning: string;
  sentences: Sentence[];
  relatedWords: string[];
};

type HistoryEntry = {
  id: string;
  word: string;
  result: DictResult;
  searchedAt: number;
};

const HISTORY_KEY = "palmingo:dict-history";
const MAX_HISTORY = 60;

function getHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
  catch { return []; }
}

function saveHistory(entry: HistoryEntry) {
  try {
    const h = getHistory().filter((e) => e.word.toLowerCase() !== entry.word.toLowerCase());
    h.unshift(entry);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, MAX_HISTORY)));
  } catch {}
}

function clearHistory() {
  try { localStorage.removeItem(HISTORY_KEY); } catch {}
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d >= today) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (d >= yesterday) return "—";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

const SUGGESTIONS = ["Resilient", "Ephemeral", "Eloquent", "Serendipity", "Perseverance", "Ambiguous", "Intuitive", "Meticulous"];

const LEVEL_BG: Record<string, string> = {
  A1: "rgba(34,197,94,0.15)", A2: "rgba(132,204,22,0.15)",
  B1: "rgba(234,179,8,0.15)",  B2: "rgba(249,115,22,0.15)",
  C1: "rgba(239,68,68,0.15)",  C2: "rgba(139,92,246,0.15)",
};
const LEVEL_COLOR: Record<string, string> = {
  A1: "#16a34a", A2: "#65a30d", B1: "#ca8a04", B2: "#ea580c", C1: "#dc2626", C2: "#7c3aed",
};

export default function Dictionary() {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DictResult | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>(() => getHistory());
  const [activeTab, setActiveTab] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState("");

  const progress = getProgress();

  const search = async (word: string) => {
    const w = word.trim();
    if (!w) return;
    setQ(w); setLoading(true); setError(""); setResult(null); setShowHistory(false);
    try {
      const r = await fetch("/api/ai/dictionary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: w,
          nativeLang: progress.nativeLang || "Arabic",
          targetLang: progress.targetLang || "English",
          level: progress.level || "B1",
        }),
      });
      if (!r.ok) throw new Error(`Error ${r.status}`);
      const data = await r.json() as DictResult;
      setResult(data);
      setActiveTab(0);
      const entry: HistoryEntry = { id: `${Date.now()}`, word: w, result: data, searchedAt: Date.now() };
      saveHistory(entry);
      setHistory(getHistory());
      addXp(5, "word");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to look up word");
    } finally { setLoading(false); }
  };

  const filteredHistory = history.filter((e) =>
    !historySearch || e.word.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }} className="space-y-5">

      {/* ── Header ── */}
      <header>
        <h1 style={{ fontSize: "clamp(1.4rem,4vw,1.9rem)", fontWeight: 700, color: "var(--foreground)", fontFamily: "'Space Grotesk',sans-serif", letterSpacing: "-0.03em" }}>
          📖 {t("smart_dictionary")}
        </h1>
        <p style={{ color: "var(--muted-foreground)", fontSize: 13, marginTop: 4 }}>
          {t("dict_subtitle")}
        </p>
      </header>

      {/* ── Search bar ── */}
      <form onSubmit={(e) => { e.preventDefault(); search(q); }}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: 18, padding: "6px 6px 6px 16px",
          boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
        }}
      >
        <Search style={{ width: 18, height: 18, color: "var(--muted-foreground)", flexShrink: 0 }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("search_placeholder")}
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            fontSize: 15, color: "var(--foreground)", caretColor: BRAND_ORANGE,
          }}
          autoFocus
        />
        {q && (
          <button type="button" onClick={() => { setQ(""); setResult(null); setError(""); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: 4 }}>
            <X style={{ width: 15, height: 15 }} />
          </button>
        )}
        <button type="submit" disabled={loading || !q.trim()}
          style={{
            background: !q.trim() || loading ? "var(--muted)" : `linear-gradient(135deg,${BRAND_ORANGE},#FF6B3D)`,
            color: !q.trim() || loading ? "var(--muted-foreground)" : "#fff",
            border: "none", borderRadius: 13, padding: "10px 22px",
            fontSize: 13, fontWeight: 700, cursor: q.trim() && !loading ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
            fontFamily: "'Space Grotesk',sans-serif", transition: "all 0.18s",
            boxShadow: q.trim() && !loading ? `0 4px 14px rgba(255,77,46,0.3)` : "none",
          }}
        >
          {loading
            ? <Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} />
            : <Sparkles style={{ width: 15, height: 15 }} />
          }
          {loading ? "..." : t("search_btn")}
        </button>
      </form>

      {/* ── Error ── */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 13, color: "#ef4444" }}>
          ⚠️ {error}
        </motion.div>
      )}

      {/* ── Loading skeleton ── */}
      <AnimatePresence>
        {loading && (
          <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, padding: 24 }}>
            <div style={{ width: 140, height: 30, borderRadius: 8, background: "var(--muted)", marginBottom: 14, animation: "pulse 1.4s infinite" }} />
            <div style={{ width: 90, height: 18, borderRadius: 6, background: "var(--muted)", marginBottom: 20, animation: "pulse 1.4s infinite" }} />
            {[100, 80, 90].map((w, i) => (
              <div key={i} style={{ height: 14, borderRadius: 6, background: "var(--muted)", marginBottom: 10, width: `${w}%`, animation: "pulse 1.4s infinite" }} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Result card ── */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div key="result"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 22, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}
          >
            {/* Word + IPA + translation */}
            <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{
                    fontSize: "clamp(1.4rem,5vw,1.9rem)", fontWeight: 800,
                    color: "var(--foreground)", fontFamily: "'Space Grotesk',sans-serif",
                    letterSpacing: "-0.04em", lineHeight: 1.1,
                  }}>
                    {result.word}
                  </h2>
                  {result.ipa && (
                    <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 3, fontFamily: "monospace", letterSpacing: "0.03em" }}>
                      {result.ipa}
                    </p>
                  )}
                  {result.translation && (
                    <div style={{
                      marginTop: 10, display: "inline-flex", alignItems: "center",
                      background: `rgba(255,77,46,0.10)`, border: `1px solid rgba(255,77,46,0.18)`,
                      borderRadius: 24, padding: "5px 14px",
                    }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: BRAND_ORANGE }}>
                        {result.translation}
                      </span>
                    </div>
                  )}
                </div>
                {/* Pronounce button */}
                <button onClick={() => speak(result.word, "en-US")}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    background: "var(--secondary)", border: "1px solid var(--border)",
                    borderRadius: 24, padding: "9px 18px", cursor: "pointer",
                    color: BRAND_ORANGE, fontSize: 13, fontWeight: 600,
                    fontFamily: "'Space Grotesk',sans-serif", flexShrink: 0,
                    transition: "all 0.18s",
                    boxShadow: "0 2px 8px rgba(255,77,46,0.12)",
                  }}
                >
                  <Volume2 style={{ width: 15, height: 15 }} />
                  {t("pronounce")}
                </button>
              </div>

              {/* Meaning in native language */}
              {result.meaning && (
                <div style={{
                  marginTop: 16, padding: "14px 18px",
                  background: "var(--muted)", borderRadius: 14,
                  border: "1px solid var(--border)",
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: BRAND_ORANGE, marginBottom: 6 }}>
                    {t("meaning")}
                  </p>
                  <p style={{ fontSize: 14, color: "var(--foreground)", lineHeight: 1.7 }}>
                    {result.meaning}
                  </p>
                </div>
              )}
            </div>

            {/* Example sentences (3 levels) */}
            {result.sentences && result.sentences.length > 0 && (
              <div style={{ padding: "18px 24px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)", marginBottom: 12 }}>
                  {t("examples")}
                </p>
                {/* Level tabs */}
                <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
                  {result.sentences.map((s, i) => (
                    <button key={i} onClick={() => setActiveTab(i)}
                      style={{
                        padding: "5px 14px", borderRadius: 24,
                        fontSize: 11, fontWeight: 700, cursor: "pointer",
                        border: "none", transition: "all 0.15s",
                        background: activeTab === i
                          ? (LEVEL_BG[s.level] || "rgba(255,77,46,0.12)")
                          : "var(--muted)",
                        color: activeTab === i
                          ? (LEVEL_COLOR[s.level] || BRAND_ORANGE)
                          : "var(--muted-foreground)",
                      }}
                    >
                      {s.level}
                    </button>
                  ))}
                </div>
                <AnimatePresence mode="wait">
                  <motion.div key={activeTab}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div style={{
                      background: "var(--background)", borderRadius: 16,
                      border: "1px solid var(--border)", padding: "16px 18px",
                    }}>
                      <p style={{ fontSize: 15, fontWeight: 500, color: "var(--foreground)", lineHeight: 1.7, marginBottom: 10 }}>
                        {result.sentences[activeTab].en}
                      </p>
                      <p style={{ fontSize: 14, color: "var(--muted-foreground)", lineHeight: 1.7, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                        {result.sentences[activeTab].native}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            )}

            {/* Related words */}
            {result.relatedWords && result.relatedWords.length > 0 && (
              <div style={{ padding: "0 24px 22px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)", marginBottom: 10 }}>
                  {t("related")}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {result.relatedWords.map((w) => (
                    <button key={w} onClick={() => search(w)}
                      style={{
                        padding: "6px 15px", borderRadius: 24, fontSize: 13,
                        background: "var(--muted)", border: "1px solid var(--border)",
                        color: "var(--foreground)", cursor: "pointer", transition: "all 0.15s",
                      }}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Suggestions ── */}
      {!result && !loading && !error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {SUGGESTIONS.map((w) => (
              <button key={w} onClick={() => search(w)}
                style={{
                  padding: "8px 18px", borderRadius: 24, fontSize: 13,
                  background: "var(--card)", border: "1px solid var(--border)",
                  color: "var(--foreground)", cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {w}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── History ── */}
      {history.length > 0 && (
        <div style={{ borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}>
          <button onClick={() => setShowHistory((h) => !h)}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 18px",
              background: "var(--card)", border: "none", cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Clock style={{ width: 16, height: 16, color: BRAND_ORANGE }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>
                {t("history")} <span style={{ color: "var(--muted-foreground)", fontWeight: 400 }}>({history.length})</span>
              </span>
            </div>
            {showHistory
              ? <ChevronUp style={{ width: 16, height: 16, color: "var(--muted-foreground)" }} />
              : <ChevronDown style={{ width: 16, height: 16, color: "var(--muted-foreground)" }} />
            }
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                style={{ overflow: "hidden" }}
              >
                <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)", background: "var(--background)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--muted)", borderRadius: 10, padding: "8px 12px" }}>
                    <Search style={{ width: 13, height: 13, color: "var(--muted-foreground)" }} />
                    <input value={historySearch} onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder={t("search_placeholder")}
                      style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13, color: "var(--foreground)" }}
                    />
                    {historySearch && (
                      <button onClick={() => setHistorySearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}>
                        <X style={{ width: 13, height: 13 }} />
                      </button>
                    )}
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                    <button onClick={() => { clearHistory(); setHistory([]); setShowHistory(false); }}
                      style={{ fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>
                      {t("delete")}
                    </button>
                  </div>
                </div>

                <div style={{ maxHeight: 280, overflowY: "auto", background: "var(--card)" }}>
                  {filteredHistory.length === 0 ? (
                    <p style={{ padding: "20px 18px", fontSize: 13, color: "var(--muted-foreground)", textAlign: "center" }}>—</p>
                  ) : (
                    filteredHistory.map((entry, i) => (
                      <button key={entry.id}
                        onClick={() => { setResult(entry.result); setQ(entry.word); setActiveTab(0); setShowHistory(false); }}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", gap: 12,
                          padding: "12px 18px",
                          borderBottom: i < filteredHistory.length - 1 ? "1px solid var(--border)" : "none",
                          background: "transparent", border: "none", cursor: "pointer", textAlign: "left",
                          transition: "background 0.14s",
                        }}
                      >
                        <BookOpen style={{ width: 15, height: 15, color: BRAND_ORANGE, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--foreground)" }}>{entry.word}</div>
                          <div style={{ fontSize: 11, color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {entry.result.translation || entry.result.meaning?.slice(0, 40)}
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--muted-foreground)", flexShrink: 0 }}>
                          {formatDate(entry.searchedAt)}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
