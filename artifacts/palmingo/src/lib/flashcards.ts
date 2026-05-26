// Flashcard spaced-repetition engine — based on Make It Stick principles
// (retrieval practice, spaced repetition, interleaving)

export type CardLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type FlashCard = {
  id: string;
  front: string;       // word / phrase in target language
  back: string;        // translation / meaning
  example?: string;    // example sentence
  level: CardLevel;    // 0=New … 5=Mastered
  nextReview: number;  // unix-ms timestamp
  streak: number;      // consecutive correct answers
  createdAt: number;
  lastReviewed?: number;
};

export type Deck = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  language: string;
  cards: FlashCard[];
  createdAt: number;
  isPreset?: boolean;
};

// SM-2 simplified review intervals (ms)
// 0→1min  1→10min  2→1day  3→3days  4→7days  5→21days
export const REVIEW_INTERVALS: Record<CardLevel, number> = {
  0: 60_000,
  1: 600_000,
  2: 86_400_000,
  3: 3 * 86_400_000,
  4: 7 * 86_400_000,
  5: 21 * 86_400_000,
};

export const LEVEL_LABELS: Record<CardLevel, string> = {
  0: "New", 1: "Hard", 2: "Okay", 3: "Good", 4: "Great", 5: "Mastered",
};

export const LEVEL_COLORS: Record<CardLevel, string> = {
  0: "#94a3b8",  // slate  – new
  1: "#ef4444",  // red    – hard
  2: "#f97316",  // orange – okay
  3: "#eab308",  // yellow – good
  4: "#22c55e",  // green  – great
  5: "#8b5cf6",  // purple – mastered
};

const STORAGE_KEY = "palmingo:decks-v2";

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/* ── CRUD ─────────────────────────────────────────────── */

export function getDecks(): Deck[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Deck[]) : [];
  } catch { return []; }
}

export function saveDecks(decks: Deck[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(decks)); } catch {}
}

export function getDeckById(id: string): Deck | undefined {
  return getDecks().find((d) => d.id === id);
}

export function upsertDeck(deck: Deck): void {
  const decks = getDecks();
  const idx = decks.findIndex((d) => d.id === deck.id);
  if (idx >= 0) decks[idx] = deck;
  else decks.unshift(deck);
  saveDecks(decks);
}

export function deleteDeck(id: string): void {
  saveDecks(getDecks().filter((d) => d.id !== id));
}

export function addCardToDeck(
  deckId: string, front: string, back: string, example?: string
): Deck | null {
  const decks = getDecks();
  const idx = decks.findIndex((d) => d.id === deckId);
  if (idx < 0) return null;
  decks[idx].cards.push({
    id: generateId(),
    front: front.trim(),
    back: back.trim(),
    example: example?.trim(),
    level: 0,
    nextReview: Date.now(),
    streak: 0,
    createdAt: Date.now(),
  });
  saveDecks(decks);
  return decks[idx];
}

export function deleteCard(deckId: string, cardId: string): void {
  const decks = getDecks();
  const deck = decks.find((d) => d.id === deckId);
  if (!deck) return;
  deck.cards = deck.cards.filter((c) => c.id !== cardId);
  saveDecks(decks);
}

/** Apply SM-2 rating to a card */
export function rateCard(
  deckId: string, cardId: string,
  rating: "again" | "good" | "easy"
): void {
  const decks = getDecks();
  const deck = decks.find((d) => d.id === deckId);
  if (!deck) return;
  const card = deck.cards.find((c) => c.id === cardId);
  if (!card) return;

  const now = Date.now();
  card.lastReviewed = now;

  if (rating === "again") {
    card.level = 1;
    card.streak = 0;
    card.nextReview = now + REVIEW_INTERVALS[1];
  } else if (rating === "good") {
    const next = Math.min(5, card.level + 1) as CardLevel;
    card.level = next;
    card.streak += 1;
    card.nextReview = now + REVIEW_INTERVALS[next];
  } else {
    // easy → jump 2 levels
    const next = Math.min(5, card.level + 2) as CardLevel;
    card.level = next;
    card.streak += 1;
    card.nextReview = now + REVIEW_INTERVALS[next];
  }

  saveDecks(decks);
}

/** Cards whose review time has passed (or all if none are due) */
export function getDueCards(deck: Deck): FlashCard[] {
  const now = Date.now();
  const due = deck.cards.filter((c) => c.nextReview <= now);
  return due.length > 0 ? due : [...deck.cards];
}

/** Fisher-Yates shuffle — for interleaving */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ── Preset decks ─────────────────────────────────────── */

function makeCard(id: string, front: string, back: string): FlashCard {
  return { id, front, back, level: 0, nextReview: Date.now(), streak: 0, createdAt: Date.now() };
}

export const PRESET_DECKS: Deck[] = [
  {
    id: "preset-everyday", name: "Everyday Life", description: "Essential phrases for daily conversations",
    emoji: "🌞", language: "English", isPreset: true, createdAt: 0,
    cards: [
      makeCard("e1","Hello","مرحبا"), makeCard("e2","Thank you","شكراً"),
      makeCard("e3","Please","من فضلك"), makeCard("e4","Sorry","آسف"),
      makeCard("e5","Excuse me","عفواً"), makeCard("e6","How are you?","كيف حالك؟"),
      makeCard("e7","Good morning","صباح الخير"), makeCard("e8","Good night","تصبح على خير"),
    ],
  },
  {
    id: "preset-travel", name: "Travel & Tourism", description: "Phrases for your next adventure",
    emoji: "✈️", language: "English", isPreset: true, createdAt: 0,
    cards: [
      makeCard("t1","Where is...?","أين يقع...؟"), makeCard("t2","Airport","مطار"),
      makeCard("t3","Hotel","فندق"), makeCard("t4","Ticket","تذكرة"),
      makeCard("t5","How much?","كم الثمن؟"), makeCard("t6","Help!","مساعدة!"),
      makeCard("t7","I'm lost","أنا تائه"), makeCard("t8","Bus station","محطة الأتوبيس"),
    ],
  },
  {
    id: "preset-food", name: "Food & Dining", description: "Restaurants, cafes and cooking",
    emoji: "🍽️", language: "English", isPreset: true, createdAt: 0,
    cards: [
      makeCard("f1","Menu","قائمة الطعام"), makeCard("f2","Delicious","لذيذ"),
      makeCard("f3","Water","ماء"), makeCard("f4","Bill please","الحساب، من فضلك"),
      makeCard("f5","Vegetarian","نباتي"), makeCard("f6","Spicy","حار"),
      makeCard("f7","Reservation","حجز"), makeCard("f8","Breakfast","فطور"),
    ],
  },
  {
    id: "preset-business", name: "Business & Work", description: "Professional vocabulary",
    emoji: "💼", language: "English", isPreset: true, createdAt: 0,
    cards: [
      makeCard("b1","Meeting","اجتماع"), makeCard("b2","Deadline","موعد نهائي"),
      makeCard("b3","Project","مشروع"), makeCard("b4","Presentation","عرض تقديمي"),
      makeCard("b5","Client","عميل"), makeCard("b6","Contract","عقد"),
      makeCard("b7","Invoice","فاتورة"), makeCard("b8","Report","تقرير"),
    ],
  },
  {
    id: "preset-emotions", name: "Feelings & Emotions", description: "Express yourself authentically",
    emoji: "💭", language: "English", isPreset: true, createdAt: 0,
    cards: [
      makeCard("m1","Happy","سعيد"), makeCard("m2","Sad","حزين"),
      makeCard("m3","Excited","متحمس"), makeCard("m4","Confused","محتار"),
      makeCard("m5","Proud","فخور"), makeCard("m6","Nervous","قلق"),
      makeCard("m7","Surprised","مندهش"), makeCard("m8","Grateful","ممتنّ"),
    ],
  },
  {
    id: "preset-numbers", name: "Numbers & Time", description: "Count and tell time with ease",
    emoji: "🔢", language: "English", isPreset: true, createdAt: 0,
    cards: [
      makeCard("n1","One","واحد"), makeCard("n2","Ten","عشرة"),
      makeCard("n3","Monday","الاثنين"), makeCard("n4","Month","شهر"),
      makeCard("n5","Year","سنة"), makeCard("n6","Now","الآن"),
      makeCard("n7","Yesterday","أمس"), makeCard("n8","Tomorrow","غدًا"),
    ],
  },
];

/** Initialise localStorage with preset decks on first ever load */
export function initDecks(): void {
  const existing = getDecks();
  if (existing.length > 0) return;
  saveDecks(PRESET_DECKS.map((d) => ({ ...d, createdAt: Date.now() })));
}
