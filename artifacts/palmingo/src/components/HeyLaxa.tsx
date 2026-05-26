import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { speak, stopSpeech } from "@/lib/speech";
import { getProgress } from "@/lib/progress";
import { BRAND_ORANGE } from "@/lib/theme";

const SPARKLE_PATH =
  "M100 8 C 104 60,140 96,192 100 C 140 104,104 140,100 192 C 96 140,60 104,8 100 C 60 96,96 60,100 8 Z";
const MINI_PATH =
  "M10 0 C 10.6 6,14.4 9.4,20 10 C 14.4 10.6,10.6 14,10 20 C 9.4 14,5.6 10.6,0 10 C 5.6 9.4,9.4 6,10 0 Z";

const PAGE_LABELS: Record<string, string> = {
  "/home": "the home dashboard",
  "/flashcards": "the flashcard decks page",
  "/dictionary": "the dictionary page",
  "/chunks": "the topics/chunks page",
  "/videos": "the videos page",
  "/progress": "the progress page",
  "/profile": "the profile page",
  "/settings": "the settings page",
};

const WAKE_WORDS = ["hey laxa", "هاي لاكسا", "هي لاكسا", "laxa", "لاكسا"];

type Phase = "idle" | "listening" | "thinking" | "speaking";

export function HeyLaxa() {
  const [location] = useLocation();
  const [phase, setPhase] = useState<Phase>("idle");
  const [response, setResponse] = useState("");
  const recogRef = useRef<any>(null);
  const activeRef = useRef(false);
  const waitingRef = useRef(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pageContext = PAGE_LABELS[location] || "the app";

  const dismiss = () => {
    stopSpeech();
    setPhase("idle");
    setResponse("");
    activeRef.current = false;
    waitingRef.current = false;
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
  };

  const handleQuestion = async (question: string) => {
    if (activeRef.current) return;
    activeRef.current = true;
    waitingRef.current = false;
    setPhase("thinking");
    setResponse("");
    if (dismissTimer.current) clearTimeout(dismissTimer.current);

    try {
      const profile = getProgress();
      const r = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: question }],
          level: profile.level || "B1",
          targetLang: profile.targetLang || "English",
          nativeLang: profile.nativeLang || "Arabic",
          scenario: `User is on ${pageContext} and asked a quick question. Answer briefly (1-2 sentences max).`,
        }),
      });
      if (!r.ok) throw new Error("ai-error");
      const data = (await r.json()) as { text: string };
      setResponse(data.text);
      setPhase("speaking");
      await speak(data.text);
      dismissTimer.current = setTimeout(dismiss, 4000);
    } catch {
      setResponse("Sorry, I couldn't answer that. Try again!");
      setPhase("speaking");
      dismissTimer.current = setTimeout(dismiss, 3000);
    } finally {
      activeRef.current = false;
    }
  };

  const startBg = () => {
    const w = window as any;
    const SR: (new () => any) | undefined = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) return;

    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "";

    r.onresult = (e: any) => {
      const transcript = Array.from(e.results as ArrayLike<any>)
        .map((res: any) => res[0].transcript)
        .join(" ")
        .toLowerCase()
        .trim();

      if (activeRef.current) return;

      const wakeHit = WAKE_WORDS.find((w) => transcript.includes(w));
      if (wakeHit && !waitingRef.current) {
        const afterWake = transcript.slice(transcript.indexOf(wakeHit) + wakeHit.length).trim();
        if (afterWake.length > 4) {
          handleQuestion(afterWake);
        } else {
          waitingRef.current = true;
          setPhase("listening");
        }
        return;
      }

      if (waitingRef.current) {
        const noWake = WAKE_WORDS.every((w) => !transcript.includes(w));
        if (noWake && transcript.length > 4) {
          handleQuestion(transcript);
        }
      }
    };

    r.onend = () => {
      if (location !== "/laxa" && document.visibilityState === "visible") {
        try { r.start(); } catch {}
      }
    };
    r.onerror = () => {
      setTimeout(startBg, 2000);
    };

    recogRef.current = r;
    try { r.start(); } catch {}
  };

  useEffect(() => {
    if (location === "/laxa") {
      recogRef.current?.stop();
      return;
    }
    startBg();
    const onVisibility = () => {
      if (document.visibilityState === "visible" && location !== "/laxa") {
        try { recogRef.current?.start(); } catch {}
      } else {
        try { recogRef.current?.stop(); } catch {}
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      try { recogRef.current?.stop(); } catch {}
    };
  }, [location]);

  return (
    <AnimatePresence>
      {phase !== "idle" && (
        <motion.div
          initial={{ opacity: 0, y: -80, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -60, scale: 0.85 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          onClick={dismiss}
          style={{
            position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
            zIndex: 9999, display: "flex", flexDirection: "column",
            alignItems: "center", gap: 10, cursor: "pointer",
            pointerEvents: "all",
          }}
        >
          {/* Glow background */}
          <div style={{
            position: "absolute", inset: -24, borderRadius: "50%",
            background: `radial-gradient(circle, rgba(255,77,46,0.18) 0%, transparent 70%)`,
            filter: "blur(12px)", pointerEvents: "none",
          }} />

          {/* Sparkle logo */}
          <div style={{ position: "relative", width: 52, height: 52 }}>
            <motion.div
              style={{
                position: "absolute", inset: -8, borderRadius: "50%",
                background: BRAND_ORANGE, opacity: 0.15,
                filter: "blur(10px)",
              }}
              animate={{ opacity: [0.1, 0.25, 0.1], scale: [0.9, 1.1, 0.9] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.svg viewBox="0 0 200 200" width={52} height={52}
              style={{ position: "absolute", inset: 0, color: BRAND_ORANGE }}
            >
              <motion.path fill="currentColor" d={SPARKLE_PATH}
                animate={phase === "thinking" || phase === "listening"
                  ? { scale: [1, 1.07, 1] } : {}}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformOrigin: "center", transformBox: "fill-box" }}
              />
            </motion.svg>
            <motion.svg viewBox="0 0 20 20" width={13} height={13}
              style={{ position: "absolute", top: -3, right: -4, color: "#FFB37A" }}
            >
              <motion.path fill="currentColor" d={MINI_PATH}
                animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                style={{ transformOrigin: "center", transformBox: "fill-box" }}
              />
            </motion.svg>
          </div>

          {/* Status + response */}
          {(phase === "listening" || phase === "thinking" || (phase === "speaking" && !response)) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              style={{
                padding: "8px 16px", borderRadius: 20,
                background: "var(--card, #fff)",
                border: `1px solid rgba(255,77,46,0.2)`,
                boxShadow: "0 4px 24px rgba(255,77,46,0.12)",
                fontSize: 13, color: "var(--muted-foreground, #888)",
                backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                whiteSpace: "nowrap",
              }}
            >
              {phase === "listening" ? "I'm listening…" : "Thinking…"}
            </motion.div>
          )}

          {phase === "speaking" && response && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              style={{
                maxWidth: "min(340px, 90vw)",
                padding: "10px 16px", borderRadius: 16,
                background: "var(--card, #fff)",
                border: `1px solid rgba(255,77,46,0.25)`,
                boxShadow: "0 6px 32px rgba(255,77,46,0.15)",
                fontSize: 13, lineHeight: 1.5, color: "var(--foreground, #111)",
                backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                textAlign: "center",
              }}
            >
              {response.replace(/[*_`~#>]/g, "").trim()}
            </motion.div>
          )}

          <span style={{ fontSize: 10, color: "rgba(0,0,0,0.3)", marginTop: -2 }}>
            tap to dismiss
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
