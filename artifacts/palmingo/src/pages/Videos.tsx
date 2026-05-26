import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, Loader2, Plus, X, BookOpen, Sparkles, Search, Link2 } from "lucide-react";
import { speak } from "@/lib/speech";
import { addXp } from "@/lib/progress";

type Caption = { startMs: number; endMs: number; text: string };
type CaptionSource = "loading" | "youtube" | "ai" | "none";

interface YTPlayer {
  getCurrentTime: () => number;
  getPlayerState: () => number;
  loadVideoById: (id: string) => void;
  destroy: () => void;
}

declare global {
  interface Window {
    YT: {
      Player: new (
        el: string | HTMLElement,
        config: {
          videoId?: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { data: number }) => void;
          };
        }
      ) => YTPlayer;
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface WordPopup {
  word: string;
  sentence: string;
  x: number;
  y: number;
}
interface WordData {
  translation: string;
  ipa: string;
  grammar: string;
  loading: boolean;
  saved: boolean;
}

const CURATED = [
  { id: "F-TyZN_zR1Q", title: "Speak English Fluently in 30 Days", channel: "EnglishWithLucy", topic: "fluency tips" },
  { id: "juFZh92MUOY", title: "Spanish for Beginners — Lesson 1", channel: "Butterfly Spanish", topic: "Spanish basics" },
  { id: "wD3FJgij79c", title: "How to Learn Any Language Fast", channel: "Olly Richards", topic: "learning method" },
  { id: "T2_LJ4F2bgM", title: "French Pronunciation Made Easy", channel: "Français Authentique", topic: "French pronunciation" },
  { id: "LlKNSCv0FVs", title: "English Vocabulary Builder", channel: "EnglishWithLucy", topic: "vocabulary" },
  { id: "5MgBikgcWnY", title: "German Phrases for Beginners", channel: "Learn German", topic: "German basics" },
];

function extractId(input: string): string | null {
  const t = input.trim();
  if (/^[\w-]{11}$/.test(t)) return t;
  const m = t.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function getFlashcards(): { word: string; meaning: string; example: string; lang: string; addedAt: number }[] {
  try { return JSON.parse(localStorage.getItem("palmingo:flashcards") || "[]"); } catch { return []; }
}
function saveFlashcard(word: string, meaning: string, example = "") {
  const arr = getFlashcards();
  arr.push({ word, meaning, example, lang: "en-US", addedAt: Date.now() });
  localStorage.setItem("palmingo:flashcards", JSON.stringify(arr));
}

export default function Videos() {
  const [urlInput, setUrlInput] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; title: string; channel: string }[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const [activeVideo, setActiveVideo] = useState<{ id: string; title: string } | null>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [captionLines, setCaptionLines] = useState<string[]>([]);
  const [captionsSource, setCaptionsSource] = useState<CaptionSource>("none");
  const [currentIdx, setCurrentIdx] = useState(-1);

  const [popup, setPopup] = useState<WordPopup | null>(null);
  const [wordData, setWordData] = useState<WordData | null>(null);

  const playerRef = useRef<YTPlayer | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ytReadyRef = useRef(false);
  const captionsRef = useRef<Caption[]>([]);
  const captionListRef = useRef<HTMLDivElement>(null);

  useEffect(() => { captionsRef.current = captions; }, [captions]);

  // Load YouTube IFrame API once
  useEffect(() => {
    if ((window as { YT?: unknown }).YT) { ytReadyRef.current = true; return; }
    window.onYouTubeIframeAPIReady = () => { ytReadyRef.current = true; };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
  }, []);

  const startPoll = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      if (!playerRef.current) return;
      const t = playerRef.current.getCurrentTime() * 1000;
      const idx = captionsRef.current.findIndex((c) => t >= c.startMs && t < c.endMs);
      setCurrentIdx(idx);
      if (idx >= 0 && captionListRef.current) {
        const el = captionListRef.current.querySelector(`[data-idx="${idx}"]`) as HTMLElement | null;
        el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }, 180);
  }, []);

  const stopPoll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const createPlayer = useCallback((videoId: string) => {
    if (!containerRef.current) return;
    if (playerRef.current) { try { playerRef.current.destroy(); } catch { /* noop */ } playerRef.current = null; }
    stopPoll();
    containerRef.current.innerHTML = "";
    const div = document.createElement("div");
    containerRef.current.appendChild(div);
    playerRef.current = new window.YT.Player(div, {
      videoId,
      playerVars: { rel: 0, modestbranding: 1, cc_load_policy: 1 },
      events: {
        onReady: (e) => { playerRef.current = e.target; startPoll(); },
        onStateChange: (e) => {
          if (e.data === 1) startPoll();
          if (e.data === 2 || e.data === 0) stopPoll();
        },
      },
    });
  }, [startPoll, stopPoll]);

  const loadVideo = useCallback(async (id: string, title: string) => {
    setActiveVideo({ id, title });
    setCaptions([]); setCaptionLines([]); setCurrentIdx(-1);
    setCaptionsSource("loading"); setPopup(null);

    const doCreate = () => createPlayer(id);
    if (ytReadyRef.current && window.YT?.Player) {
      doCreate();
    } else {
      window.onYouTubeIframeAPIReady = () => { ytReadyRef.current = true; doCreate(); };
    }

    // Attempt real YouTube captions
    try {
      const r = await fetch("/api/ai/youtube-captions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: id }),
      });
      const data = await r.json() as { captions?: Caption[]; source?: string };
      if (data.captions && data.captions.length > 0) {
        setCaptions(data.captions); setCaptionsSource("youtube");
        addXp(5); return;
      }
    } catch { /* fall through */ }

    // Fallback: AI transcript
    setCaptionsSource("ai");
    try {
      const r = await fetch("/api/ai/transcript", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, topic: "language learning" }),
      });
      const data = await r.json() as { transcript?: string };
      if (data.transcript) {
        setCaptionLines(data.transcript.split("\n").filter(Boolean));
        return;
      }
    } catch { /* noop */ }
    setCaptionsSource("none");
  }, [createPlayer]);

  const handleUrlLoad = () => {
    const id = extractId(urlInput.trim());
    if (!id) return;
    loadVideo(id, "YouTube Video");
    setUrlInput("");
  };

  const handleSearch = async () => {
    if (!searchQ.trim()) return;
    const id = extractId(searchQ.trim());
    if (id) { loadVideo(id, "YouTube Video"); setSearchQ(""); return; }
    setSearchLoading(true);
    try {
      const r = await fetch("/api/ai/search-youtube", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: searchQ }),
      });
      const d = await r.json() as { results?: { id: string; title: string; channel: string }[] };
      setSearchResults(d.results ?? []);
    } finally { setSearchLoading(false); }
  };

  const handleWordTap = useCallback(async (word: string, sentence: string, e: React.MouseEvent) => {
    const clean = word.replace(/[^a-zA-ZÀ-ÿ'-]/g, "").trim();
    if (!clean) return;
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = Math.min(rect.left + rect.width / 2, window.innerWidth - 300);
    const y = Math.min(rect.bottom + 8, window.innerHeight - 260);
    setPopup({ word: clean, sentence, x, y });
    setWordData({ translation: "", ipa: "", grammar: "", loading: true, saved: false });
    try {
      const [trRes, grRes] = await Promise.all([
        fetch("/api/ai/translate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ word: clean, context: sentence }),
        }).then((r) => r.json()),
        fetch("/api/ai/grammar", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ word: clean, sentence }),
        }).then((r) => r.json()),
      ]);
      setWordData({
        translation: (trRes as { translation?: string }).translation ?? "",
        ipa: (trRes as { ipa?: string }).ipa ?? "",
        grammar: (grRes as { text?: string }).text ?? "",
        loading: false, saved: false,
      });
      addXp(2, "word");
    } catch {
      setWordData((p) => p ? { ...p, loading: false } : null);
    }
  }, []);

  const handleSaveCard = () => {
    if (!popup || !wordData?.translation) return;
    saveFlashcard(popup.word, wordData.translation);
    setWordData((p) => p ? { ...p, saved: true } : null);
    addXp(6, "word");
  };

  useEffect(() => () => {
    stopPoll();
    if (playerRef.current) { try { playerRef.current.destroy(); } catch { /* noop */ } }
  }, [stopPoll]);

  const displayList = searchResults ?? CURATED;

  function WordLine({ text, sentence }: { text: string; sentence: string }) {
    return (
      <>
        {text.split(/(\s+)/).map((tok, i) => {
          const isWord = /[a-zA-ZÀ-ÿ'-]{2,}/.test(tok);
          return isWord ? (
            <button
              key={i}
              onClick={(e) => handleWordTap(tok, sentence, e)}
              className="hover:text-primary hover:underline underline-offset-2 decoration-dotted transition-colors cursor-pointer"
            >{tok}</button>
          ) : <span key={i}>{tok}</span>;
        })}
      </>
    );
  }

  return (
    <div className="max-w-5xl mx-auto" onClick={() => setPopup(null)}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Video Hub</h1>
        <p className="text-muted-foreground text-sm mt-1">Paste any YouTube link or search. Tap any word in the captions to translate, hear it, and save.</p>
      </div>

      {/* URL input */}
      <div className="glass rounded-2xl p-3 mb-4 flex gap-2 items-center">
        <Link2 className="w-4 h-4 text-muted-foreground ml-1 flex-shrink-0" />
        <input
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 min-w-0"
          placeholder="Paste a YouTube URL to load with live captions…"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleUrlLoad()}
        />
        <button
          onClick={handleUrlLoad}
          disabled={!urlInput.trim()}
          className="gradient-primary text-white rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-40 transition flex-shrink-0"
        >
          Load
        </button>
      </div>

      {/* Active video panel */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div
            key={activeVideo.id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass-strong rounded-3xl overflow-hidden mb-6"
          >
            <div className="flex flex-col md:flex-row md:h-[380px]">
              {/* Player */}
              <div className="md:flex-1 bg-black flex items-center justify-center min-h-[220px]">
                <div ref={containerRef} className="w-full h-full" style={{ aspectRatio: "16/9" }} />
              </div>

              {/* Caption panel */}
              <div className="md:w-80 flex flex-col border-t md:border-t-0 md:border-l border-white/10">
                <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-medium truncate flex-1">{activeVideo.title}</span>
                  {captionsSource === "loading" && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground flex-shrink-0" />}
                  {captionsSource === "youtube" && <span className="text-[10px] bg-green-500/20 text-green-500 px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium">LIVE CC</span>}
                  {captionsSource === "ai" && <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium">AI</span>}
                  <button onClick={() => setActiveVideo(null)} className="ml-1 text-muted-foreground hover:text-foreground flex-shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div ref={captionListRef} className="flex-1 overflow-y-auto p-3 space-y-1 max-h-56 md:max-h-none">
                  {captionsSource === "loading" && (
                    <div className="flex items-center gap-2 text-muted-foreground text-xs py-6 justify-center">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching captions…
                    </div>
                  )}
                  {captionsSource === "none" && (
                    <p className="text-muted-foreground text-xs py-6 text-center">No captions available.</p>
                  )}
                  {/* Timed captions */}
                  {captions.map((cap, idx) => (
                    <div
                      key={idx} data-idx={idx}
                      className={`px-2 py-1.5 rounded-xl text-sm leading-relaxed transition-colors ${
                        idx === currentIdx ? "bg-primary/15 text-primary font-medium" : "text-foreground/80"
                      }`}
                    >
                      <WordLine text={cap.text} sentence={cap.text} />
                    </div>
                  ))}
                  {/* AI lines */}
                  {captionsSource === "ai" && captionLines.map((line, idx) => (
                    <div key={idx} className="px-2 py-1.5 rounded-xl text-sm leading-relaxed text-foreground/80">
                      <WordLine text={line} sentence={line} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Word popup */}
      <AnimatePresence>
        {popup && (
          <motion.div
            key="popup"
            initial={{ opacity: 0, scale: 0.93, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.16 }}
            style={{ position: "fixed", left: popup.x - 136, top: popup.y, zIndex: 200, width: 272 }}
            className="glass-strong rounded-2xl p-4 shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="font-bold text-xl leading-none">{popup.word}</span>
              <button onClick={() => setPopup(null)} className="text-muted-foreground hover:text-foreground -mt-0.5 -mr-0.5 p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {wordData?.loading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-3">
                <Loader2 className="w-4 h-4 animate-spin" /> Looking it up…
              </div>
            ) : wordData ? (
              <div className="space-y-2.5">
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                    Translation {wordData.ipa && <span>· <span className="font-mono text-[11px]">/{wordData.ipa}/</span></span>}
                  </div>
                  <p className="font-semibold text-sm" dir="auto">{wordData.translation || "—"}</p>
                </div>
                {wordData.grammar && (
                  <div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                      <BookOpen className="w-3 h-3" /> Grammar
                    </div>
                    <p className="text-xs text-foreground/80 leading-relaxed">{wordData.grammar}</p>
                  </div>
                )}
                <div className="flex gap-2 pt-0.5">
                  <button
                    onClick={() => speak(popup.word, "en-US")}
                    className="flex-1 flex items-center justify-center gap-1 glass rounded-xl py-2 text-xs font-medium hover:text-primary transition"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Play
                  </button>
                  <button
                    onClick={handleSaveCard}
                    disabled={wordData.saved || !wordData.translation}
                    className={`flex-1 flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-medium transition ${
                      wordData.saved
                        ? "bg-green-500/20 text-green-500"
                        : "gradient-primary text-white disabled:opacity-50"
                    }`}
                  >
                    {wordData.saved ? <><Sparkles className="w-3.5 h-3.5" /> Saved!</> : <><Plus className="w-3.5 h-3.5" /> Save</>}
                  </button>
                </div>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="glass rounded-2xl p-3 mb-6 flex gap-2 items-center">
        <Search className="w-4 h-4 text-muted-foreground ml-1 flex-shrink-0" />
        <input
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 min-w-0"
          placeholder="Search YouTube for language lessons…"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button
          onClick={handleSearch}
          disabled={searchLoading || !searchQ.trim()}
          className="gradient-primary text-white rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-40 transition flex-shrink-0 flex items-center gap-1.5"
        >
          {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
        </button>
      </div>

      {/* Video grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayList.map((vid, i) => (
          <motion.button
            key={vid.id}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => loadVideo(vid.id, vid.title)}
            className={`glass rounded-2xl overflow-hidden text-left hover:scale-[1.02] transition-transform group ${
              activeVideo?.id === vid.id ? "ring-2 ring-primary" : ""
            }`}
          >
            <div className="relative aspect-video bg-black/20">
              <img
                src={`https://i.ytimg.com/vi/${vid.id}/mqdefault.jpg`}
                alt={vid.title}
                className="w-full h-full object-cover group-hover:opacity-95 transition"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">▶ Play</div>
            </div>
            <div className="p-3">
              <div className="font-medium text-sm line-clamp-2 mb-0.5">{vid.title}</div>
              <div className="text-xs text-muted-foreground">{vid.channel}</div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
