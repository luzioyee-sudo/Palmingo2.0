// Make It Stick flashcard system:
// Retrieval practice · Spaced repetition (SM-2) · Interleaving · Immediate feedback

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  ArrowLeft, Plus, Trash2, BookOpen, Layers, ChevronRight,
  RotateCw, Check, X, Zap, Volume2, Target, Trophy, Flame,
} from "lucide-react";
import { speak } from "@/lib/speech";
import { addXp } from "@/lib/progress";
import { useI18n } from "@/lib/i18n";
import { BRAND_ORANGE } from "@/lib/theme";
import {
  type Deck, type FlashCard, type CardLevel,
  LEVEL_LABELS, LEVEL_COLORS, PRESET_DECKS,
  getDecks, upsertDeck, deleteDeck,
  addCardToDeck, deleteCard, rateCard,
  getDueCards, shuffle, generateId, initDecks,
} from "@/lib/flashcards";

/* ═══════════════════════════════════════════════════════
   SHARED UTILS
═══════════════════════════════════════════════════════ */

function LevelBadge({ level }: { level: CardLevel }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
      background: `${LEVEL_COLORS[level]}22`,
      color: LEVEL_COLORS[level],
      border: `1px solid ${LEVEL_COLORS[level]}44`,
      textTransform: "uppercase", letterSpacing: "0.06em",
    }}>
      {LEVEL_LABELS[level]}
    </span>
  );
}

function StatBox({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div style={{
      flex: 1, padding: "14px 12px", borderRadius: 14, textAlign: "center",
      background: highlight && value > 0 ? `rgba(255,77,46,0.08)` : "var(--muted)",
      border: `1px solid ${highlight && value > 0 ? `rgba(255,77,46,0.2)` : "var(--border)"}`,
    }}>
      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif",
        color: highlight && value > 0 ? BRAND_ORANGE : "var(--foreground)" }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>{label}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STUDY MODE
═══════════════════════════════════════════════════════ */

function StudyMode({ deck, onBack, onComplete }: { deck: Deck; onBack: () => void; onComplete: () => void }) {
  const { t } = useI18n();
  const due = getDueCards(deck);
  const [queue] = useState<FlashCard[]>(() => shuffle(due.length > 0 ? due : [...deck.cards]));
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const total = queue.length;

  const card = queue[idx];

  const rate = (rating: "again" | "good" | "easy") => {
    rateCard(deck.id, card.id, rating);
    const isCorrect = rating !== "again";
    if (isCorrect) { setCorrect((c) => c + 1); addXp(rating === "easy" ? 10 : 8, "card"); }
    else addXp(2, "card");

    if (idx < total - 1) {
      setFlipped(false);
      setTimeout(() => setIdx((i) => i + 1), 180);
    } else {
      setDone(true);
      onComplete();
    }
  };

  // Done screen
  if (done) {
    const pct = Math.round((correct / total) * 100);
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center", padding: "40px 16px" }}>
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>{pct >= 80 ? "🏆" : pct >= 50 ? "🎯" : "💪"}</div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--foreground)", fontFamily: "'Space Grotesk',sans-serif", letterSpacing: "-0.03em" }}>
            {t("study_complete")}
          </h2>
          <p style={{ color: "var(--muted-foreground)", marginTop: 8, fontSize: 14 }}>
            {t("well_done")}
          </p>
        </motion.div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28 }}>
          <StatBox label={t("total_label")} value={total} />
          <StatBox label={t("correct")} value={correct} highlight />
          <StatBox label="%" value={pct} />
        </div>
        <p style={{ marginTop: 20, fontSize: 13, color: "var(--muted-foreground)" }}>
          {t("spaced_rep_note")}
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 28, flexWrap: "wrap" }}>
          <button onClick={onBack}
            style={{
              flex: 1, padding: "13px", borderRadius: 14, border: "1px solid var(--border)",
              background: "var(--card)", color: "var(--foreground)", cursor: "pointer",
              fontSize: 14, fontWeight: 600, fontFamily: "'Space Grotesk',sans-serif",
            }}
          >
            {t("back_to_deck")}
          </button>
          <button onClick={() => { setIdx(0); setFlipped(false); setCorrect(0); setDone(false); }}
            style={{
              flex: 1, padding: "13px", borderRadius: 14, border: "none",
              background: `linear-gradient(135deg,${BRAND_ORANGE},#FF6B3D)`, color: "#fff",
              cursor: "pointer", fontSize: 14, fontWeight: 700,
              fontFamily: "'Space Grotesk',sans-serif",
              boxShadow: `0 4px 14px rgba(255,77,46,0.3)`,
            }}
          >
            {t("study_again")}
          </button>
        </div>
      </div>
    );
  }

  const progress = (idx / total) * 100;

  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      {/* Progress + back */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack}
          style={{ background: "none", border: "none", cursor: "pointer", color: BRAND_ORANGE, display: "flex" }}>
          <ArrowLeft style={{ width: 20, height: 20 }} />
        </button>
        <div style={{ flex: 1, height: 6, borderRadius: 6, background: "var(--muted)", overflow: "hidden" }}>
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeOut", duration: 0.3 }}
            style={{ height: "100%", borderRadius: 6, background: `linear-gradient(90deg,${BRAND_ORANGE},#FF6B3D)` }}
          />
        </div>
        <span style={{ fontSize: 12, color: "var(--muted-foreground)", flexShrink: 0 }}>
          {idx + 1} / {total}
        </span>
      </div>

      {/* Card */}
      <div
        onClick={() => !flipped && setFlipped(true)}
        style={{
          perspective: 1200, cursor: flipped ? "default" : "pointer",
          height: 320, marginBottom: 24,
        }}
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ width: "100%", height: "100%", position: "relative", transformStyle: "preserve-3d" }}
        >
          {/* Front */}
          <div style={{
            position: "absolute", inset: 0,
            background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: 24, padding: "32px 28px",
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            backfaceVisibility: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <LevelBadge level={card.level} />
              <button onClick={(e) => { e.stopPropagation(); speak(card.front, "en-US"); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: BRAND_ORANGE, display: "flex" }}>
                <Volume2 style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{
                fontSize: "clamp(1.6rem,6vw,2.4rem)", fontWeight: 800,
                color: "var(--foreground)", fontFamily: "'Space Grotesk',sans-serif",
                letterSpacing: "-0.03em", lineHeight: 1.2,
              }}>
                {card.front}
              </p>
            </div>
            <p style={{ textAlign: "center", fontSize: 12, color: "var(--muted-foreground)" }}>
              {t("tap_to_reveal")}
            </p>
          </div>

          {/* Back */}
          <div style={{
            position: "absolute", inset: 0,
            background: "var(--card)", border: `2px solid rgba(255,77,46,0.3)`,
            borderRadius: 24, padding: "28px",
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            backfaceVisibility: "hidden", transform: "rotateY(180deg)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
          }}>
            <div />
            <div style={{ textAlign: "center" }}>
              <p style={{
                fontSize: "clamp(1.3rem,5vw,1.9rem)", fontWeight: 700,
                color: BRAND_ORANGE, fontFamily: "'Space Grotesk',sans-serif",
                letterSpacing: "-0.02em",
              }}>
                {card.back}
              </p>
              {card.example && (
                <p style={{ marginTop: 14, fontSize: 13, color: "var(--muted-foreground)", fontStyle: "italic", lineHeight: 1.6 }}>
                  "{card.example}"
                </p>
              )}
            </div>
            <p style={{ textAlign: "center", fontSize: 11, color: "var(--muted-foreground)" }}>
              {t("how_well")}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Rating buttons (only shown after flip) */}
      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: "flex", gap: 10 }}
          >
            <button onClick={() => rate("again")}
              style={{
                flex: 1, padding: "13px 8px", borderRadius: 14, border: "1px solid rgba(239,68,68,0.3)",
                background: "rgba(239,68,68,0.08)", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              }}
            >
              <X style={{ width: 20, height: 20, color: "#ef4444" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>{t("again")}</span>
            </button>
            <button onClick={() => rate("good")}
              style={{
                flex: 1, padding: "13px 8px", borderRadius: 14, border: "1px solid rgba(34,197,94,0.3)",
                background: "rgba(34,197,94,0.08)", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              }}
            >
              <Check style={{ width: 20, height: 20, color: "#22c55e" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#22c55e" }}>{t("good")}</span>
            </button>
            <button onClick={() => rate("easy")}
              style={{
                flex: 1, padding: "13px 8px", borderRadius: 14,
                border: `1px solid rgba(255,77,46,0.3)`,
                background: `rgba(255,77,46,0.08)`, cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              }}
            >
              <Zap style={{ width: 20, height: 20, color: BRAND_ORANGE }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: BRAND_ORANGE }}>{t("easy")}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {!flipped && (
        <p style={{ textAlign: "center", fontSize: 12, color: "var(--muted-foreground)", marginTop: 8 }}>
          {t("try_recall")}
        </p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DECK DETAIL
═══════════════════════════════════════════════════════ */

function AddWordForm({ deckId, onAdded, onClose }: { deckId: string; onAdded: () => void; onClose: () => void }) {
  const { t } = useI18n();
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [example, setExample] = useState("");
  const frontRef = useRef<HTMLInputElement>(null);

  useEffect(() => { frontRef.current?.focus(); }, []);

  const save = () => {
    if (!front.trim() || !back.trim()) return;
    addCardToDeck(deckId, front, back, example || undefined);
    onAdded();
    onClose();
  };

  const inp = {
    background: "var(--background)", border: "1px solid var(--border)",
    borderRadius: 12, padding: "10px 14px", fontSize: 14,
    color: "var(--foreground)", outline: "none", width: "100%",
  } as React.CSSProperties;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 520,
          background: "var(--background)", border: "1px solid var(--border)",
          borderRadius: "24px 24px 0 0", padding: "24px 20px 40px",
        }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border)", margin: "0 auto 20px" }} />
        <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--foreground)", fontFamily: "'Space Grotesk',sans-serif", marginBottom: 20 }}>
          {t("add_word")}
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)", display: "block", marginBottom: 6 }}>
              {t("word_front")} *
            </label>
            <input ref={frontRef} value={front} onChange={(e) => setFront(e.target.value)} style={inp} placeholder="e.g. Ephemeral" />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)", display: "block", marginBottom: 6 }}>
              {t("word_back")} *
            </label>
            <input value={back} onChange={(e) => setBack(e.target.value)} style={inp} placeholder="..." />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)", display: "block", marginBottom: 6 }}>
              {t("example")}
            </label>
            <input value={example} onChange={(e) => setExample(e.target.value)} style={inp} placeholder="e.g. Fame is ephemeral." />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "13px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
              {t("cancel")}
            </button>
            <button onClick={save} disabled={!front.trim() || !back.trim()}
              style={{
                flex: 2, padding: "13px", borderRadius: 14, border: "none",
                background: front.trim() && back.trim() ? `linear-gradient(135deg,${BRAND_ORANGE},#FF6B3D)` : "var(--muted)",
                color: front.trim() && back.trim() ? "#fff" : "var(--muted-foreground)",
                cursor: front.trim() && back.trim() ? "pointer" : "not-allowed",
                fontSize: 14, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif",
              }}
            >
              {t("add_word")}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DeckDetail({ deck, onBack, onStudy, onRefresh }: { deck: Deck; onBack: () => void; onStudy: () => void; onRefresh: () => void }) {
  const { t } = useI18n();
  const [showAddWord, setShowAddWord] = useState(false);
  const due = getDueCards(deck);
  const dueCount = deck.cards.filter((c) => c.nextReview <= Date.now()).length;
  const mastered = deck.cards.filter((c) => c.level === 5).length;

  return (
    <div className="space-y-5" style={{ maxWidth: 680, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack}
          style={{ background: "none", border: "none", cursor: "pointer", color: BRAND_ORANGE, display: "flex" }}>
          <ArrowLeft style={{ width: 20, height: 20 }} />
        </button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--foreground)", fontFamily: "'Space Grotesk',sans-serif", letterSpacing: "-0.03em" }}>
            {deck.emoji} {deck.name}
          </h1>
          <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 }}>{deck.description}</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 10 }}>
        <StatBox label={t("total_label")} value={deck.cards.length} />
        <StatBox label={t("due_today")} value={dueCount} highlight />
        <StatBox label={t("mastered")} value={mastered} />
      </div>

      {/* Study button */}
      <button onClick={onStudy} disabled={deck.cards.length === 0}
        style={{
          width: "100%", padding: "15px", borderRadius: 16, border: "none",
          background: deck.cards.length > 0
            ? `linear-gradient(135deg,${BRAND_ORANGE},#FF6B3D)` : "var(--muted)",
          color: deck.cards.length > 0 ? "#fff" : "var(--muted-foreground)",
          cursor: deck.cards.length > 0 ? "pointer" : "not-allowed",
          fontSize: 15, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: deck.cards.length > 0 ? `0 6px 20px rgba(255,77,46,0.3)` : "none",
        }}
      >
        <Flame style={{ width: 18, height: 18 }} />
        {dueCount > 0
          ? `${t("study_now")} (${dueCount} ${t("due_short")})`
          : t("study_all")}
      </button>

      {/* Add word (not for preset decks) */}
      {!deck.isPreset && (
        <button onClick={() => setShowAddWord(true)}
          style={{
            width: "100%", padding: "12px", borderRadius: 14,
            border: `1px dashed rgba(255,77,46,0.4)`, background: "transparent",
            color: BRAND_ORANGE, cursor: "pointer", fontSize: 14, fontWeight: 600,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <Plus style={{ width: 17, height: 17 }} />
          {t("add_word")}
        </button>
      )}

      {/* Word list */}
      {deck.cards.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted-foreground)", fontSize: 14 }}>
          {t("no_cards_yet")}
        </div>
      ) : (
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)", marginBottom: 10 }}>
            {t("all_words")} ({deck.cards.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {deck.cards.map((card) => (
              <div key={card.id}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 14px", borderRadius: 12,
                  background: "var(--card)", border: "1px solid var(--border)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>{card.front}</span>
                    <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>→</span>
                    <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>{card.back}</span>
                  </div>
                  {card.example && (
                    <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2, fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      "{card.example}"
                    </p>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <LevelBadge level={card.level} />
                  {!deck.isPreset && (
                    <button onClick={() => { deleteCard(deck.id, card.id); onRefresh(); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: 4 }}>
                      <Trash2 style={{ width: 13, height: 13 }} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showAddWord && (
          <AddWordForm deckId={deck.id} onAdded={onRefresh} onClose={() => setShowAddWord(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CREATE DECK MODAL
═══════════════════════════════════════════════════════ */

const DECK_EMOJIS = ["📚","🗺️","💡","🧠","🎯","🌟","⚡","🔥","💎","🌍","🎨","🏆","🚀","💬","📝"];
const DECK_LANGS = ["English", "German", "French", "Spanish", "Italian", "Portuguese", "Japanese", "Arabic"];

function CreateDeckModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [emoji, setEmoji] = useState("📚");
  const [lang, setLang] = useState("English");

  const create = () => {
    if (!name.trim()) return;
    const deck: Deck = {
      id: generateId(),
      name: name.trim(),
      description: desc.trim() || name.trim(),
      emoji,
      language: lang,
      cards: [],
      createdAt: Date.now(),
    };
    upsertDeck(deck);
    onCreated(deck.id);
  };

  const inp = {
    background: "var(--background)", border: "1px solid var(--border)",
    borderRadius: 12, padding: "10px 14px", fontSize: 14,
    color: "var(--foreground)", outline: "none", width: "100%",
  } as React.CSSProperties;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 520,
          background: "var(--background)", border: "1px solid var(--border)",
          borderRadius: "24px 24px 0 0", padding: "24px 20px 40px",
        }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border)", margin: "0 auto 20px" }} />
        <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--foreground)", fontFamily: "'Space Grotesk',sans-serif", marginBottom: 20 }}>
          {t("create_deck")}
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Emoji picker */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)", display: "block", marginBottom: 8 }}>
              {t("icon")}
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {DECK_EMOJIS.map((e) => (
                <button key={e} onClick={() => setEmoji(e)}
                  style={{
                    width: 38, height: 38, borderRadius: 10, fontSize: 18, cursor: "pointer",
                    border: `2px solid ${emoji === e ? BRAND_ORANGE : "transparent"}`,
                    background: emoji === e ? `rgba(255,77,46,0.1)` : "var(--muted)",
                    transition: "all 0.15s",
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)", display: "block", marginBottom: 6 }}>
              {t("deck_name")} *
            </label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={inp} autoFocus />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)", display: "block", marginBottom: 6 }}>
              {t("deck_lang")}
            </label>
            <select value={lang} onChange={(e) => setLang(e.target.value)} style={inp}>
              {DECK_LANGS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)", display: "block", marginBottom: 6 }}>
              {t("description_opt")}
            </label>
            <input value={desc} onChange={(e) => setDesc(e.target.value)} style={inp} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "13px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
              {t("cancel")}
            </button>
            <button onClick={create} disabled={!name.trim()}
              style={{
                flex: 2, padding: "13px", borderRadius: 14, border: "none",
                background: name.trim() ? `linear-gradient(135deg,${BRAND_ORANGE},#FF6B3D)` : "var(--muted)",
                color: name.trim() ? "#fff" : "var(--muted-foreground)",
                cursor: name.trim() ? "pointer" : "not-allowed",
                fontSize: 14, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif",
              }}
            >
              {t("create_deck")}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   DECK LIST
═══════════════════════════════════════════════════════ */

function DeckList({ decks, onSelect, onRefresh }: { decks: Deck[]; onSelect: (id: string) => void; onRefresh: () => void }) {
  const { t } = useI18n();
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const presetDecks = decks.filter((d) => d.isPreset);
  const userDecks = decks.filter((d) => !d.isPreset);

  const handleDelete = (id: string) => {
    if (confirmDelete === id) { deleteDeck(id); onRefresh(); setConfirmDelete(null); }
    else { setConfirmDelete(id); setTimeout(() => setConfirmDelete(null), 3000); }
  };

  return (
    <div className="space-y-7" style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Header */}
      <header>
        <h1 style={{ fontSize: "clamp(1.4rem,4vw,1.9rem)", fontWeight: 800, color: "var(--foreground)", fontFamily: "'Space Grotesk',sans-serif", letterSpacing: "-0.03em" }}>
          🃏 {t("flashcards")}
        </h1>
        <p style={{ color: "var(--muted-foreground)", fontSize: 13, marginTop: 4 }}>
          {t("flashcards_subtitle")}
        </p>
      </header>

      {/* Preset decks — horizontal scroll */}
      <section>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)", marginBottom: 12 }}>
          {t("preset_decks")}
        </p>
        <div style={{ overflowX: "auto", display: "flex", gap: 12, paddingBottom: 8, scrollbarWidth: "none" }}>
          {presetDecks.map((deck) => {
            const dueCount = deck.cards.filter((c) => c.nextReview <= Date.now()).length;
            const mastered = deck.cards.filter((c) => c.level === 5).length;
            return (
              <button key={deck.id} onClick={() => onSelect(deck.id)}
                style={{
                  flexShrink: 0, width: 155, padding: "18px 14px",
                  borderRadius: 18, textAlign: "left",
                  background: "var(--card)", border: "1px solid var(--border)",
                  cursor: "pointer", transition: "all 0.18s",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ fontSize: 30, marginBottom: 10 }}>{deck.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", lineHeight: 1.3, marginBottom: 6 }}>
                  {deck.name}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 8 }}>
                  {deck.cards.length} {t("cards_count")}
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {dueCount > 0 && (
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: `rgba(255,77,46,0.1)`, color: BRAND_ORANGE, fontWeight: 700 }}>
                      {dueCount} {t("due_short")}
                    </span>
                  )}
                  {mastered > 0 && (
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: `rgba(139,92,246,0.1)`, color: "#8b5cf6", fontWeight: 700 }}>
                      {mastered} ✓
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* User decks */}
      <section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)" }}>
            {t("your_decks")}
          </p>
          <button onClick={() => setShowCreate(true)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 14px", borderRadius: 20, border: "none",
              background: `linear-gradient(135deg,${BRAND_ORANGE},#FF6B3D)`,
              color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700,
              boxShadow: `0 3px 10px rgba(255,77,46,0.3)`,
            }}
          >
            <Plus style={{ width: 14, height: 14 }} />
            {t("create_deck")}
          </button>
        </div>

        {userDecks.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              padding: "32px 24px", textAlign: "center",
              background: "var(--card)", border: `1px dashed rgba(255,77,46,0.3)`,
              borderRadius: 18,
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>📂</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", marginBottom: 4 }}>{t("no_decks")}</p>
            <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 16 }}>
              {t("create_first_deck_desc")}
            </p>
            <button onClick={() => setShowCreate(true)}
              style={{
                padding: "10px 24px", borderRadius: 24, border: "none",
                background: `linear-gradient(135deg,${BRAND_ORANGE},#FF6B3D)`,
                color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700,
              }}
            >
              {t("create_my_first_deck")}
            </button>
          </motion.div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12 }}>
            {userDecks.map((deck) => {
              const dueCount = deck.cards.filter((c) => c.nextReview <= Date.now()).length;
              const pct = deck.cards.length > 0
                ? Math.round((deck.cards.filter((c) => c.level >= 3).length / deck.cards.length) * 100)
                : 0;
              return (
                <div key={deck.id} style={{ position: "relative" }}>
                  <button onClick={() => onSelect(deck.id)}
                    style={{
                      width: "100%", padding: "18px 14px", borderRadius: 18, textAlign: "left",
                      background: "var(--card)", border: "1px solid var(--border)",
                      cursor: "pointer", transition: "all 0.18s",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{deck.emoji}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", lineHeight: 1.3, marginBottom: 4 }}>
                      {deck.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 8 }}>
                      {deck.cards.length} {t("cards_count")} · {deck.language}
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: 3, borderRadius: 2, background: "var(--muted)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: BRAND_ORANGE, borderRadius: 2 }} />
                    </div>
                    {dueCount > 0 && (
                      <div style={{ marginTop: 8, fontSize: 10, fontWeight: 700, color: BRAND_ORANGE }}>
                        {dueCount} {t("due_today")}
                      </div>
                    )}
                  </button>
                  {/* Delete button */}
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(deck.id); }}
                    style={{
                      position: "absolute", top: 8, right: 8,
                      background: confirmDelete === deck.id ? "rgba(239,68,68,0.15)" : "var(--muted)",
                      border: "none", borderRadius: 8, width: 26, height: 26,
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Trash2 style={{ width: 12, height: 12, color: confirmDelete === deck.id ? "#ef4444" : "var(--muted-foreground)" }} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <AnimatePresence>
        {showCreate && (
          <CreateDeckModal
            onClose={() => setShowCreate(false)}
            onCreated={(id) => { onRefresh(); setShowCreate(false); onSelect(id); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ROOT FLASHCARDS COMPONENT — URL-based routing
═══════════════════════════════════════════════════════ */

export default function Flashcards() {
  const [location, navigate] = useLocation();
  const [decks, setDecks] = useState<Deck[]>([]);

  useEffect(() => {
    initDecks();
    setDecks(getDecks());
  }, []);

  const refreshDecks = () => setDecks(getDecks());

  // Determine view from URL
  const studyMatch = location.match(/\/flashcards\/([^/]+)\/study/);
  const deckMatch = !studyMatch ? location.match(/\/flashcards\/([^/]+)$/) : null;
  const currentDeckId = studyMatch?.[1] || deckMatch?.[1];
  const currentDeck = currentDeckId ? decks.find((d) => d.id === currentDeckId) : undefined;

  if (studyMatch && currentDeck) {
    return (
      <StudyMode
        deck={currentDeck}
        onBack={() => navigate(`/flashcards/${currentDeckId}`)}
        onComplete={refreshDecks}
      />
    );
  }

  if (deckMatch && currentDeck) {
    return (
      <DeckDetail
        deck={currentDeck}
        onBack={() => navigate("/flashcards")}
        onStudy={() => navigate(`/flashcards/${currentDeckId}/study`)}
        onRefresh={() => { refreshDecks(); setDecks(getDecks()); }}
      />
    );
  }

  return (
    <DeckList
      decks={decks}
      onSelect={(id) => navigate(`/flashcards/${id}`)}
      onRefresh={refreshDecks}
    />
  );
}
