const KEY = "palmingo:progress";

export type Progress = {
  xp: number;
  streak: number;
  lastActive: string;
  wordsLearned: number;
  cardsReviewed: number;
  minutesPracticed: number;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  targetLang: string;
  nativeLang: string;
};

const DEFAULT: Progress = {
  xp: 0, streak: 0, lastActive: "", wordsLearned: 0, cardsReviewed: 0,
  minutesPracticed: 0, level: "A1", targetLang: "English", nativeLang: "Arabic",
};

function today() { return new Date().toISOString().slice(0, 10); }

export function getProgress(): Progress {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch { return DEFAULT; }
}

export function saveProgress(p: Partial<Progress>) {
  if (typeof window === "undefined") return;
  const next = { ...getProgress(), ...p };
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("palmingo:progress", { detail: next }));
}

export function addXp(amount: number, kind?: "word" | "card" | "minute") {
  const p = getProgress();
  const t = today();
  let streak = p.streak;
  if (p.lastActive !== t) {
    const yest = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    streak = p.lastActive === yest ? p.streak + 1 : 1;
  }
  saveProgress({
    xp: p.xp + amount,
    streak,
    lastActive: t,
    wordsLearned: p.wordsLearned + (kind === "word" ? 1 : 0),
    cardsReviewed: p.cardsReviewed + (kind === "card" ? 1 : 0),
    minutesPracticed: p.minutesPracticed + (kind === "minute" ? 1 : 0),
  });
}

export function palmStage(xp: number) {
  return Math.min(6, Math.floor(xp / 50));
}

export function levelFromXp(xp: number): Progress["level"] {
  if (xp > 3000) return "C2";
  if (xp > 1500) return "C1";
  if (xp > 800) return "B2";
  if (xp > 350) return "B1";
  if (xp > 120) return "A2";
  return "A1";
}
