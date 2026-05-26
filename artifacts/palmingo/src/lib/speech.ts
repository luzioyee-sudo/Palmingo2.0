let currentAudio: HTMLAudioElement | null = null;
const ttsCache = new Map<string, string>();
const voiceByLang = new Map<string, SpeechSynthesisVoice>();
let voicesLoaded = false;

function cleanForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/~~.*?~~/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/[*_`~#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function ensureVoices(): Promise<void> {
  if (voicesLoaded) return;
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  return new Promise((resolve) => {
    const tryLoad = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length) { voicesLoaded = true; resolve(); }
      else setTimeout(tryLoad, 120);
    };
    window.speechSynthesis.onvoiceschanged = () => { voicesLoaded = true; resolve(); };
    tryLoad();
  });
}

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const base = lang.split("-")[0];
  if (voiceByLang.has(base)) return voiceByLang.get(base);

  const voices = window.speechSynthesis.getVoices();
  const lc = lang.toLowerCase();
  const score = (v: SpeechSynthesisVoice) => {
    const n = v.name.toLowerCase();
    let s = 0;
    if (v.lang.toLowerCase() === lc) s += 20;
    else if (v.lang.toLowerCase().startsWith(base)) s += 10;
    if (n.includes("google")) s += 8;
    if (n.includes("neural") || n.includes("natural")) s += 6;
    if (v.localService === false) s += 4;
    if (n.includes("premium") || n.includes("enhanced")) s += 3;
    if (/female|woman|samantha|aria|jenny|libby|emma|sonia|amelia|zira|joanna|amy|aoede|kore|leda/.test(n)) s += 5;
    return s;
  };
  const best = [...voices].sort((a, b) => score(b) - score(a))[0];
  if (best) voiceByLang.set(base, best);
  return best;
}

async function playDataUrl(
  dataUrl: string,
  onStart?: (durationMs: number) => void
): Promise<void> {
  return new Promise((resolve) => {
    const el = new Audio(dataUrl);
    currentAudio = el;
    el.play()
      .then(() => {
        const dur = el.duration && isFinite(el.duration) ? el.duration * 1000 : 3500;
        onStart?.(dur);
      })
      .catch(() => { currentAudio = null; resolve(); });
    el.onended = () => { currentAudio = null; resolve(); };
    el.onerror = () => { currentAudio = null; resolve(); };
  });
}

async function fallbackSpeak(
  text: string,
  lang: string,
  onStart?: (durationMs: number) => void
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) { resolve(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickVoice(lang);
    if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = lang;
    u.rate = 0.95;
    u.onstart = () => {
      const estimatedMs = Math.max(1500, (text.length / 10) * 1000);
      onStart?.(estimatedMs);
    };
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

export async function speak(
  text: string,
  lang = "en-US",
  onStart?: (durationMs: number) => void
): Promise<void> {
  stopSpeech();
  const clean = cleanForSpeech(text);
  if (!clean) return;

  if (typeof window !== "undefined") await ensureVoices().catch(() => {});

  const cached = ttsCache.get(clean);
  if (cached) {
    await playDataUrl(cached, onStart);
    return;
  }

  try {
    const r = await fetch("/api/ai/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: clean }),
    });
    if (!r.ok) throw new Error("tts-failed");
    const { audio, mimeType } = (await r.json()) as { audio: string; mimeType: string };
    const dataUrl = `data:${mimeType};base64,${audio}`;
    ttsCache.set(clean, dataUrl);
    await playDataUrl(dataUrl, onStart);
  } catch {
    await fallbackSpeak(clean, lang, onStart);
  }
}

export function stopSpeech() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
}
