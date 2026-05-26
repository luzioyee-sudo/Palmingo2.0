// LAXA UI UPDATE — Change 1 — AI Chat Screen Full Layout Redesign
//   Header: [☰ sidebar] [Laxa AI centered] [🕐 history]
//   Floating input bar: [+] [input] [≡ Talk to Laxa] [🎤]
// LAXA UI UPDATE — Change 2 — History Screen (slide-in overlay)
// LAXA UI UPDATE — Change 4 — All icons use BRAND_ORANGE
// LAXA UI UPDATE — Change 5 — All colors via CSS variables (dark/light mode)

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Volume2, Plus, X, ArrowLeft, Clock, Search, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Markdown } from "@/components/Markdown";
import { speak, stopSpeech } from "@/lib/speech";
import { getProgress, addXp, saveProgress } from "@/lib/progress";
import { BRAND_ORANGE } from "@/lib/theme";
import {
  type Conversation,
  type ConversationMessage,
  generateConvId,
  getConversations,
  saveConversation,
  groupConversationsByDate,
  formatConvTimestamp,
} from "@/lib/conversations";

type Msg = ConversationMessage;

const LANG_MAP: Record<string, string> = {
  English: "en-US", Spanish: "es-ES", French: "fr-FR", German: "de-DE",
  Italian: "it-IT", Japanese: "ja-JP", Arabic: "ar-SA",
};

function extractReply(md: string) {
  return md
    .replace(/~~.*?~~/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/[*_`~#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* ── Official Laxa Sparkle ─────────────────────────────── */
const LAXA_PATH =
  "M100 8 C 104 60,140 96,192 100 C 140 104,104 140,100 192 C 96 140,60 104,8 100 C 60 96,96 60,100 8 Z";
const MINI_PATH =
  "M10 0 C 10.6 6,14.4 9.4,20 10 C 14.4 10.6,10.6 14,10 20 C 9.4 14,5.6 10.6,0 10 C 5.6 9.4,9.4 6,10 0 Z";

function LaxaGemSparkle({ size = 64, pulse = false }: { size?: number; pulse?: boolean }) {
  return (
    <div style={{ width: size, height: size, position: "relative", flexShrink: 0 }}>
      <motion.div
        style={{
          position: "absolute", inset: -Math.round(size * 0.18), borderRadius: "50%",
          background: BRAND_ORANGE, opacity: 0.14,
          filter: `blur(${Math.round(size * 0.18)}px)`,
        }}
        animate={pulse ? { opacity: [0.08, 0.22, 0.08], scale: [0.85, 1.1, 0.85] } : {}}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.svg viewBox="0 0 200 200" width={size} height={size}
        style={{ position: "absolute", inset: 0, color: BRAND_ORANGE }}
        initial={{ scale: 0, rotate: -90, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.2, 1.2, 0.3, 1] }}
      >
        <motion.path fill="currentColor" d={LAXA_PATH}
          animate={pulse ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "center", transformBox: "fill-box" }}
        />
      </motion.svg>
      <motion.svg viewBox="0 0 20 20"
        width={Math.round(size * 0.25)} height={Math.round(size * 0.25)}
        style={{ position: "absolute", top: -Math.round(size * 0.06), right: -Math.round(size * 0.08), color: "#FFB37A" }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.4, ease: [0.2, 1.4, 0.4, 1] }}
      >
        <motion.path fill="currentColor" d={MINI_PATH}
          animate={pulse ? { scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] } : { opacity: 0.9 }}
          transition={{ duration: 2.4, repeat: Infinity, delay: 0.3, ease: "easeInOut" }}
          style={{ transformOrigin: "center", transformBox: "fill-box" }}
        />
      </motion.svg>
      <motion.svg viewBox="0 0 20 20"
        width={Math.round(size * 0.16)} height={Math.round(size * 0.16)}
        style={{ position: "absolute", bottom: Math.round(size * 0.04), right: Math.round(size * 0.04), color: "#FFB37A" }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.75, duration: 0.4, ease: [0.2, 1.4, 0.4, 1] }}
      >
        <motion.path fill="currentColor" d={MINI_PATH}
          animate={pulse ? { scale: [1, 1.35, 1], opacity: [0.5, 0.9, 0.5] } : { opacity: 0.7 }}
          transition={{ duration: 2.4, repeat: Infinity, delay: 0.55, ease: "easeInOut" }}
          style={{ transformOrigin: "center", transformBox: "fill-box" }}
        />
      </motion.svg>
    </div>
  );
}

/* ── Thinking indicator ────────────────────────────────── */
function Thinking() {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl rounded-bl-sm"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <LaxaGemSparkle size={18} pulse />
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span key={i} className="w-1.5 h-1.5 rounded-full"
              style={{ background: BRAND_ORANGE }}
              animate={{ y: [0, -5, 0], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.18 }}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">Laxa is thinking…</span>
      </div>
    </motion.div>
  );
}

/* LAXA UI UPDATE — Change 1 — 3-line audio-wave icon for "Talk to Laxa" */
function LiveTalkIcon({ size = 15, active = false }: { size?: number; active?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, width: size, justifyContent: "center" }}>
      {([0.75, 1, 0.55] as number[]).map((w, i) => (
        <motion.div key={i}
          style={{ height: 2, borderRadius: 2, background: BRAND_ORANGE, width: `${w * 100}%`, transformOrigin: "left center" }}
          animate={active ? { scaleX: [1, w * 0.45 + 0.4, 1] } : {}}
          transition={{ duration: 0.55 + i * 0.18, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
        />
      ))}
    </div>
  );
}

/* ── History Panel (slide-in overlay) ─────────────────── */
// LAXA UI UPDATE — Change 2 — History Screen
function HistoryPanel({
  conversations,
  currentId,
  onBack,
  onSelect,
  onNew,
}: {
  conversations: Conversation[];
  currentId: string;
  onBack: () => void;
  onSelect: (conv: Conversation) => void;
  onNew: () => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  });

  const grouped = groupConversationsByDate(filtered);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--background)" }}>

      {/* ── History header ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 16px",
        borderBottom: "1px solid var(--border)",
        background: "var(--glass)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        flexShrink: 0,
      }}>
        {/* LAXA UI UPDATE — Change 4 — Back arrow in BRAND_ORANGE */}
        <button onClick={onBack}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: BRAND_ORANGE, display: "flex", alignItems: "center", padding: 4,
          }}
        >
          <ArrowLeft style={{ width: 20, height: 20 }} />
        </button>
        <div style={{
          flex: 1, textAlign: "center",
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17,
          color: "var(--foreground)",
        }}>
          History
        </div>
        {/* Spacer to balance back arrow */}
        <div style={{ width: 28 }} />
      </div>

      {/* ── Search bar ── */}
      <div style={{ padding: "12px 16px 8px", flexShrink: 0 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          borderRadius: 14, padding: "10px 14px",
          background: "var(--muted)", border: "1px solid var(--border)",
        }}>
          {/* LAXA UI UPDATE — Change 4 — Search icon in BRAND_ORANGE */}
          <Search style={{ width: 15, height: 15, color: BRAND_ORANGE, flexShrink: 0 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              fontSize: 14, color: "var(--foreground)", caretColor: BRAND_ORANGE,
            }}
          />
          {search && (
            <button onClick={() => setSearch("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: 0 }}>
              <X style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>
      </div>

      {/* ── Start New Conversation ── */}
      <div style={{ padding: "0 16px 12px", flexShrink: 0 }}>
        <button onClick={onNew}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "12px 16px", borderRadius: 14, border: "none", cursor: "pointer",
            background: `linear-gradient(135deg, ${BRAND_ORANGE}, #FF6B3D)`,
            color: "#fff", fontSize: 14, fontWeight: 600,
            fontFamily: "'Space Grotesk', sans-serif",
            boxShadow: `0 4px 14px rgba(255,77,46,0.3)`,
          }}
        >
          {/* LAXA UI UPDATE — Change 4 — Plus icon (white on orange bg) */}
          <Plus style={{ width: 17, height: 17 }} />
          Start New Conversation
        </button>
      </div>

      {/* ── Conversations list ── */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {grouped.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "var(--muted-foreground)", lineHeight: 1.6 }}>
              {search
                ? "No conversations match your search."
                : "No saved conversations yet.\nStart chatting with Laxa!"}
            </p>
          </div>
        ) : (
          grouped.map(({ label, items }) => (
            <div key={label}>
              {/* Date group label */}
              <div style={{
                padding: "10px 16px 4px",
                fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                color: "var(--muted-foreground)",
              }}>
                {label}
              </div>

              {items.map((conv) => (
                <button key={conv.id} onClick={() => onSelect(conv)}
                  style={{
                    width: "100%", display: "flex", alignItems: "flex-start", gap: 12,
                    padding: "13px 16px",
                    background: conv.id === currentId
                      ? `rgba(255,77,46,0.07)`
                      : "transparent",
                    border: "none",
                    borderBottom: "1px solid var(--border)",
                    cursor: "pointer", textAlign: "left",
                    transition: "background 0.15s",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14,
                      fontWeight: conv.id === currentId ? 600 : 400,
                      color: "var(--foreground)",
                      lineHeight: 1.4,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {conv.title}
                    </div>
                    {conv.messages.length > 0 && (
                      <div style={{
                        fontSize: 12, color: "var(--muted-foreground)",
                        marginTop: 3, lineHeight: 1.4,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {conv.messages[conv.messages.length - 1].content.slice(0, 55)}
                      </div>
                    )}
                  </div>
                  <div style={{
                    fontSize: 11, color: "var(--muted-foreground)", flexShrink: 0, paddingTop: 2,
                  }}>
                    {formatConvTimestamp(conv.updatedAt)}
                  </div>
                </button>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN TUTOR COMPONENT
══════════════════════════════════════════════════════ */
export default function Tutor() {
  const initial = getProgress();
  const [level, setLevel] = useState(initial.level);
  const [targetLang, setTargetLang] = useState(initial.targetLang);
  const [scenario, setScenario] = useState("Free conversation");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  // LAXA UI UPDATE — Change 2 — History overlay state
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>(() => getConversations());
  // LAXA UI UPDATE — Change 2 — Current conversation ID
  const [convId, setConvId] = useState<string>(() => generateConvId());
  const [convCreatedAt] = useState<number>(() => Date.now());

  const [streamingContent, setStreamingContent] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recogRef = useRef<unknown>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const liveModeRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const streamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    saveProgress({ targetLang, level: level as "A1" | "A2" | "B1" | "B2" | "C1" });
  }, [targetLang, level]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // LAXA UI UPDATE — Change 2 — Auto-save conversation whenever messages change
  useEffect(() => {
    if (messages.length === 0) return;
    const conv: Conversation = {
      id: convId,
      title: messages[0]?.content?.slice(0, 60) || "Conversation",
      messages,
      createdAt: convCreatedAt,
      updatedAt: Date.now(),
    };
    saveConversation(conv);
    setConversations(getConversations());
  }, [messages, convId, convCreatedAt]);

  const lang = LANG_MAP[targetLang] || "en-US";

  const NATIVE_LANG_MAP: Record<string, string> = {
    Arabic: "ar-SA", English: "en-US", Spanish: "es-ES",
    French: "fr-FR", German: "de-DE", Italian: "it-IT", Japanese: "ja-JP",
  };

  const startLiveSession = () => {
    const SR = getSR();
    if (!SR || !liveModeRef.current) return;
    const profile = getProgress();
    const recLang = NATIVE_LANG_MAP[profile.nativeLang] || lang;
    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = recLang;
    r.onresult = (e) => {
      const text = Array.from({ length: e.results.length })
        .map((_, i) => (e.results as ArrayLike<ArrayLike<{ transcript: string }>>)[i][0].transcript)
        .join(" ").trim();
      if (text) sendLive(text);
    };
    r.onend = () => {
      setListening(false);
      if (liveModeRef.current && !isSpeakingRef.current) {
        setTimeout(startLiveSession, 250);
      }
    };
    r.onerror = () => {
      setListening(false);
      if (liveModeRef.current) setTimeout(startLiveSession, 600);
    };
    recogRef.current = r;
    try { r.start(); setListening(true); } catch { /* already started */ }
  };

  const sendLive = async (text: string) => {
    if (!text.trim() || !liveModeRef.current) return;
    (recogRef.current as SRInstance | null)?.stop();
    const newMsgs: Msg[] = [...messages, { role: "user", content: text.trim() }];
    setMessages(newMsgs);
    setLoading(true); setError("");
    try {
      const profile = getProgress();
      const r = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMsgs, level: String(level), targetLang, scenario,
          nativeLang: profile.nativeLang,
          profile: { xp: profile.xp, streak: profile.streak, wordsLearned: profile.wordsLearned, cardsReviewed: profile.cardsReviewed },
        }),
      });
      if (!r.ok) throw new Error(r.status === 429 ? "rate_limited" : `API error ${r.status}`);
      const data = (await r.json()) as { text: string };
      setMessages((m) => [...m, { role: "assistant", content: data.text }]);
      addXp(5);
      isSpeakingRef.current = true;
      const liveWords = extractReply(data.text).split(/\s+/).filter(Boolean);
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
      setStreamingContent("");
      await speak(extractReply(data.text), lang, (durationMs) => {
        const msPerWord = Math.max(60, durationMs / (liveWords.length || 1));
        let count = 0;
        streamTimerRef.current = setInterval(() => {
          count++;
          setStreamingContent(liveWords.slice(0, count).join(" "));
          if (count >= liveWords.length) {
            clearInterval(streamTimerRef.current!);
            streamTimerRef.current = null;
          }
        }, msPerWord);
      });
      if (streamTimerRef.current) { clearInterval(streamTimerRef.current); streamTimerRef.current = null; }
      setStreamingContent(null);
      isSpeakingRef.current = false;
      if (liveModeRef.current) startLiveSession();
    } catch (err) {
      isSpeakingRef.current = false;
      const msg = err instanceof Error ? err.message : "Failed";
      setError(msg === "rate_limited"
        ? "⏳ Laxa is resting — the AI quota has been reached. Try again in a minute."
        : "⚡ Couldn't reach Laxa right now. Please try again."
      );
      if (liveModeRef.current) setTimeout(startLiveSession, 1000);
    } finally { setLoading(false); }
  };

  const send = async (text: string) => {
    if (!text.trim()) return;
    const newMsgs: Msg[] = [...messages, { role: "user", content: text.trim() }];
    setMessages(newMsgs);
    setInput("");
    setLoading(true); setError("");
    try {
      const profile = getProgress();
      const r = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMsgs, level: String(level), targetLang, scenario,
          nativeLang: profile.nativeLang,
          profile: { xp: profile.xp, streak: profile.streak, wordsLearned: profile.wordsLearned, cardsReviewed: profile.cardsReviewed },
        }),
      });
      if (!r.ok) {
        if (r.status === 429) throw new Error("rate_limited");
        throw new Error(`API error ${r.status}`);
      }
      const data = (await r.json()) as { text: string };
      setMessages((m) => [...m, { role: "assistant", content: data.text }]);
      addXp(5);
      const words = extractReply(data.text).split(/\s+/).filter(Boolean);
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
      setStreamingContent("");
      speak(extractReply(data.text), lang, (durationMs) => {
        const msPerWord = Math.max(60, durationMs / (words.length || 1));
        let count = 0;
        streamTimerRef.current = setInterval(() => {
          count++;
          setStreamingContent(words.slice(0, count).join(" "));
          if (count >= words.length) {
            clearInterval(streamTimerRef.current!);
            streamTimerRef.current = null;
            setTimeout(() => setStreamingContent(null), 350);
          }
        }, msPerWord);
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      setError(msg === "rate_limited"
        ? "⏳ Laxa is resting — the AI quota has been reached. Try again in a minute."
        : msg.includes("500") || msg.includes("API error")
          ? "⚡ Couldn't reach Laxa right now. Please try again."
          : msg
      );
    } finally { setLoading(false); }
  };

  type SRInstance = {
    continuous: boolean; interimResults: boolean; lang: string;
    onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
    onend: () => void; onerror: () => void; start: () => void; stop: () => void;
  };
  const getSR = () => {
    const w = window as unknown as Record<string, unknown>;
    return (w["SpeechRecognition"] ?? w["webkitSpeechRecognition"]) as (new () => SRInstance) | undefined;
  };

  const toggleMic = () => {
    if (liveMode) return;
    const SR = getSR();
    if (!SR) { setError("Speech recognition not supported in this browser."); return; }
    if (listening) { (recogRef.current as SRInstance | null)?.stop(); setListening(false); return; }
    const r = new SR();
    r.continuous = false; r.interimResults = false; r.lang = lang;
    r.onresult = (e) => { send(e.results[0][0].transcript); };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r;
    r.start(); setListening(true);
  };

  const toggleLive = () => {
    if (liveMode) {
      liveModeRef.current = false;
      setLiveMode(false);
      (recogRef.current as SRInstance | null)?.stop();
      setListening(false);
      stopSpeech();
      isSpeakingRef.current = false;
    } else {
      const SR = getSR();
      if (!SR) { setError("Speech recognition not supported in this browser."); return; }
      liveModeRef.current = true;
      setLiveMode(true);
      startLiveSession();
    }
  };

  // LAXA UI UPDATE — Change 1 — + button opens file picker
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError(`📎 "${file.name}" received — file analysis coming soon!`);
      setTimeout(() => setError(""), 4000);
    }
    e.target.value = "";
  };

  // LAXA UI UPDATE — Change 2 — Load a past conversation
  const loadConversation = (conv: Conversation) => {
    setMessages(conv.messages);
    setConvId(conv.id);
    setShowHistory(false);
  };

  // LAXA UI UPDATE — Change 2 — Start a fresh conversation
  const startNewConversation = () => {
    setMessages([]);
    setConvId(generateConvId());
    setInput("");
    setError("");
    setShowHistory(false);
    stopSpeech();
  };

  // LAXA UI UPDATE — Change 1 — Open mobile sidebar via custom event
  const openSidebar = () => {
    window.dispatchEvent(new CustomEvent("palmingo:openSidebar"));
  };

  const isEmpty = messages.length === 0 && !loading;

  return (
    // LAXA UI UPDATE — Change 1 — Full-height branded layout
    // LAXA UI UPDATE — Change 5 — All colors via CSS variables
    <div style={{
      display: "flex", flexDirection: "column",
      position: "absolute", inset: 0,
      background: "var(--background)",
      backgroundImage: `
        radial-gradient(ellipse 100% 45% at 50% 0%, rgba(255, 77, 46, 0.07), transparent 100%),
        var(--gradient-aurora)
      `,
      backgroundAttachment: "fixed",
      overflow: "hidden",
    }}>

      {/* ── TOP HEADER BAR ──────────────────────────────────── */}
      {/* LAXA UI UPDATE — Change 1 — Layout: [☰ sidebar] [Laxa AI centered] [🕐 history] */}
      <div style={{
        display: "flex", alignItems: "center",
        padding: "14px 16px",
        borderBottom: "1px solid var(--border)",
        background: "var(--glass)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        flexShrink: 0, position: "relative", zIndex: 10,
      }}>

        {/* ☰ Sidebar icon — visible on mobile only (sidebar always visible on desktop) */}
        {/* LAXA UI UPDATE — Change 4 — Sidebar icon in BRAND_ORANGE */}
        <button
          onClick={openSidebar}
          className="md:invisible"   /* keeps space on desktop so "Laxa AI" stays centered */
          title="Open sidebar"
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: BRAND_ORANGE, display: "flex", alignItems: "center",
            padding: "4px 8px 4px 0",
          }}
        >
          <Menu style={{ width: 22, height: 22 }} />
        </button>

        {/* Laxa AI — centered title */}
        <div style={{ flex: 1, textAlign: "center" }}>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700, fontSize: 17, letterSpacing: "-0.03em",
            color: "var(--foreground)",
          }}>
            Laxa AI
          </span>
        </div>

        {/* 🕐 History icon */}
        {/* LAXA UI UPDATE — Change 2+4 — History icon in BRAND_ORANGE */}
        <button
          onClick={() => setShowHistory(true)}
          title="Conversation history"
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: BRAND_ORANGE, display: "flex", alignItems: "center",
            padding: "4px 0 4px 8px",
          }}
        >
          <Clock style={{ width: 20, height: 20 }} />
        </button>
      </div>

      {/* ── Settings drawer (overlay) ────────────────────────── */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            style={{
              position: "absolute", top: 62, left: 12, right: 12, zIndex: 30,
              padding: 16, borderRadius: 20,
              background: "var(--card)",
              backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
              border: "1px solid var(--border)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.14)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Session Settings
              </span>
              <button onClick={() => setShowSettings(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/5 transition"
                style={{ color: "var(--muted-foreground)" }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { label: "Language", value: targetLang, options: ["English","Spanish","French","German","Italian","Japanese","Arabic"], onChange: (v: string) => setTargetLang(v) },
                { label: "Level",    value: level,      options: ["A1","A2","B1","B2","C1"], onChange: (v: string) => setLevel(v as "A1"|"A2"|"B1"|"B2"|"C1") },
                { label: "Scenario", value: scenario,   options: ["Free conversation","Ordering at a cafe","Job interview","Travel & airport","Doctor visit","Small talk","Debate practice"], onChange: (v: string) => setScenario(v) },
              ].map((s) => (
                <div key={s.label}>
                  <label className="block text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">{s.label}</label>
                  <select value={s.value} onChange={(e) => s.onChange(e.target.value)}
                    className="w-full rounded-xl px-2 py-1.5 text-xs outline-none"
                    style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                    {s.options.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat area / Empty state ─────────────────────────── */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: "auto", position: "relative", minHeight: 0,
        paddingBottom: "8px",
      }}>
        <AnimatePresence mode="wait">
          {isEmpty ? (
            <motion.div key="empty"
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                padding: "0 24px",
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 160, damping: 18 }}
              >
                <LaxaGemSparkle size={72} pulse />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                style={{
                  marginTop: 24, fontSize: "clamp(1.5rem, 5vw, 2rem)", fontWeight: 700,
                  letterSpacing: "-0.03em", textAlign: "center",
                  color: "var(--foreground)", fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                Ready when you are
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                style={{ marginTop: 12, textAlign: "center", fontSize: 14, color: "var(--muted-foreground)", maxWidth: 280 }}
              >
                Your AI language coach — adapts to your level, corrects gently, speaks back.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.5 }}
                style={{ marginTop: 32, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 340 }}
              >
                {[
                  "Let's practice ordering coffee ☕",
                  "Correct my grammar 📝",
                  "Tell me something in " + targetLang,
                  "Start a job interview 💼",
                ].map((suggestion) => (
                  <button key={suggestion} onClick={() => send(suggestion)}
                    style={{
                      fontSize: 12, padding: "8px 14px", borderRadius: 30,
                      background: "var(--card)", border: "1px solid var(--border)",
                      color: "var(--foreground)", cursor: "pointer",
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ padding: "24px 16px", display: "flex", flexDirection: "column", gap: 16, paddingBottom: 8 }}
            >
              <AnimatePresence initial={false}>
                {messages.map((m, idx) => (
                  <motion.div key={idx}
                    initial={m.role === "user" ? { opacity: 0, x: 40, scale: 0.92 } : { opacity: 0, y: 16, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 240, damping: 24 }}
                    style={{ display: "flex", gap: 12, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}
                  >
                    {m.role === "assistant" && (
                      <div style={{ flexShrink: 0, marginTop: 4 }}>
                        <LaxaGemSparkle size={24} />
                      </div>
                    )}
                    <div style={{
                      maxWidth: "85%", padding: "12px 16px", fontSize: 14, lineHeight: 1.6,
                      borderRadius: m.role === "user" ? "24px 24px 6px 24px" : "24px 24px 24px 6px",
                      ...(m.role === "user"
                        ? { background: `linear-gradient(135deg, ${BRAND_ORANGE}, #FF6B3D)`, color: "#fff", boxShadow: "0 4px 20px rgba(255,77,46,0.25)" }
                        : { background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }
                      ),
                    }}>
                      {m.role === "user" ? (
                        <div style={{ whiteSpace: "pre-wrap", fontWeight: 500 }}>{m.content}</div>
                      ) : (
                        <div className="tutor-skin">
                          {idx === messages.length - 1 && streamingContent !== null ? (
                            <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                              {streamingContent}
                              <motion.span
                                animate={{ opacity: [1, 0, 1] }}
                                transition={{ duration: 0.7, repeat: Infinity }}
                                style={{ display: "inline-block", width: 2, height: "1em",
                                  background: BRAND_ORANGE, borderRadius: 1, marginLeft: 2, verticalAlign: "middle" }}
                              />
                            </div>
                          ) : (
                            <Markdown>{m.content}</Markdown>
                          )}
                          <button onClick={() => speak(extractReply(m.content), lang)}
                            style={{
                              marginTop: 8, fontSize: 11, display: "flex", alignItems: "center", gap: 4,
                              opacity: 0.6, cursor: "pointer", background: "none", border: "none",
                              color: BRAND_ORANGE, padding: 0,
                            }}
                          >
                            <Volume2 style={{ width: 12, height: 12 }} /> Replay
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {loading && <Thinking />}
              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{
                    fontSize: 13, padding: "10px 14px", borderRadius: 12,
                    background: "var(--muted)", color: "var(--muted-foreground)",
                    border: "1px solid var(--border)",
                  }}>
                  {error}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── INPUT BAR ──────────────────────────────────────── */}
      {/* Sticky flex item — no fixed positioning, no sidebar offset hack needed   */}
      {/* LAXA UI UPDATE — Change 4 — All icons in BRAND_ORANGE                    */}
      {/* LAXA UI UPDATE — Change 5 — Background via CSS vars, dark/light aware    */}
      <div
        style={{
          flexShrink: 0,
          padding: "8px 12px",
          paddingBottom: "calc(8px + env(safe-area-inset-bottom, 0px))",
          borderTop: "1px solid var(--border)",
          background: "transparent",
        }}
      >
        <input type="file" ref={fileInputRef} style={{ display: "none" }}
          accept="image/*,.pdf,.doc,.docx,.txt" onChange={handleFile} />

        <form
          onSubmit={(e) => { e.preventDefault(); stopSpeech(); send(input); }}
          style={{
            display: "flex", alignItems: "center",
            borderRadius: 30,
            background: "var(--card)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
            backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
            padding: "2px", minHeight: 52,
          }}
        >
          {/* [+] File/photo picker — far LEFT */}
          <button type="button" onClick={() => fileInputRef.current?.click()}
            title="Attach file or photo"
            style={{
              flexShrink: 0, width: 42, height: 42,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginLeft: 4, borderRadius: 20, border: "none", cursor: "pointer",
              background: "transparent", color: BRAND_ORANGE,
            }}
          >
            <Plus style={{ width: 19, height: 19 }} />
          </button>

          {/* Text input — center */}
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
            placeholder={liveMode ? "Live mode — speak anytime…" : listening ? "Listening…" : "Type a message…"}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              padding: "12px 8px", fontSize: 14,
              color: "var(--foreground)", caretColor: BRAND_ORANGE, minWidth: 0,
            }}
          />

          {/* [≡ Talk to Laxa] — 3-line icon + text, side by side */}
          <button type="button" onClick={toggleLive} title="Live talk with Laxa"
            style={{
              flexShrink: 0, display: "flex", alignItems: "center", gap: 5,
              padding: "8px 10px", borderRadius: 20, border: "none", cursor: "pointer",
              background: liveMode ? "rgba(255,77,46,0.12)" : "transparent",
              transition: "background 0.18s",
            }}
          >
            <LiveTalkIcon size={15} active={liveMode} />
            {/* LAXA UI UPDATE — Change 1 — "Talk to Laxa" text in BRAND_ORANGE */}
            <span style={{
              fontSize: 11, fontWeight: 600, color: BRAND_ORANGE,
              whiteSpace: "nowrap", letterSpacing: "-0.01em",
            }}>
              Talk to Laxa
            </span>
          </button>

          {/* [🎤] Mic — far RIGHT */}
          <button type="button" onClick={toggleMic} aria-label="Toggle microphone"
            style={{
              flexShrink: 0, width: 42, height: 42,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginRight: 4, borderRadius: 20, border: "none", cursor: "pointer",
              background: (listening && !liveMode) ? "rgba(255,77,46,0.12)" : "transparent",
              color: BRAND_ORANGE, transition: "background 0.18s",
            }}
          >
            {(listening && !liveMode)
              ? <MicOff style={{ width: 18, height: 18 }} />
              : <Mic style={{ width: 18, height: 18 }} />
            }
          </button>
        </form>
      </div>

      {/* ── HISTORY SCREEN (slide-in overlay) ──────────────── */}
      {/* LAXA UI UPDATE — Change 2 — Full-screen history panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            style={{
              position: "absolute", inset: 0, zIndex: 50,
              background: "var(--background)",
              overflow: "hidden",
            }}
          >
            <HistoryPanel
              conversations={conversations}
              currentId={convId}
              onBack={() => setShowHistory(false)}
              onSelect={loadConversation}
              onNew={startNewConversation}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
