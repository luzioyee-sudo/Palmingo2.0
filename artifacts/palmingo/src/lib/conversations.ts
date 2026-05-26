// LAXA UI UPDATE — Change 2 — Conversation storage for chat history

export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

export type Conversation = {
  id: string;
  title: string;          // first user message, truncated
  messages: ConversationMessage[];
  createdAt: number;      // unix ms
  updatedAt: number;      // unix ms
};

const STORAGE_KEY = "palmingo:conversations";
const MAX_CONVERSATIONS = 100;

export function generateConvId(): string {
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function getConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Conversation[];
  } catch {
    return [];
  }
}

export function saveConversation(conv: Conversation): void {
  try {
    const all = getConversations();
    const idx = all.findIndex((c) => c.id === conv.id);
    if (idx >= 0) {
      all[idx] = conv;
    } else {
      all.unshift(conv);
    }
    // Trim to max
    const trimmed = all.slice(0, MAX_CONVERSATIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {}
}

export function deleteConversation(id: string): void {
  try {
    const all = getConversations().filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

/** Group conversations into labelled date buckets for display */
export function groupConversationsByDate(
  convs: Conversation[]
): { label: string; items: Conversation[] }[] {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayMs = todayStart.getTime();

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);
  const yesterdayMs = yesterdayStart.getTime();

  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - 7);
  const weekMs = weekStart.getTime();

  const buckets: Record<string, Conversation[]> = {
    Today: [],
    Yesterday: [],
    "This Week": [],
    Older: [],
  };

  const sorted = [...convs].sort((a, b) => b.updatedAt - a.updatedAt);
  for (const conv of sorted) {
    const t = conv.updatedAt;
    if (t >= todayMs) buckets["Today"].push(conv);
    else if (t >= yesterdayMs) buckets["Yesterday"].push(conv);
    else if (t >= weekMs) buckets["This Week"].push(conv);
    else buckets["Older"].push(conv);
  }

  return Object.entries(buckets)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

/** Format a timestamp for the conversation list */
export function formatConvTimestamp(ts: number): string {
  const d = new Date(ts);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  if (d >= todayStart) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);
  if (d >= yesterdayStart) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}
