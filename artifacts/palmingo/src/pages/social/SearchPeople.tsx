import { useState } from "react";
import { searchUsers, sendFriendRequest, type SocialUser } from "@/lib/social";

function UserCard({ user, onAdd }: { user: SocialUser; onAdd: (u: SocialUser) => void }) {
  const [status, setStatus] = useState<"idle" | "sent" | "loading">("idle");

  const handleAdd = async () => {
    setStatus("loading");
    try { await sendFriendRequest(user.id); setStatus("sent"); }
    catch { setStatus("idle"); }
  };

  const initials = (user.name ?? user.username ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl mb-2"
      style={{ background: "var(--card,white)", border: "1px solid var(--border,rgba(0,0,0,0.06))", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
        style={{ background: "linear-gradient(135deg,#ff6b35,#e63000)" }}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{user.name}</p>
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>@{user.username} · Lv.{user.xp} · {user.level}</p>
      </div>
      <button
        onClick={handleAdd}
        disabled={status !== "idle"}
        className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
        style={{
          background: status === "sent"
            ? "var(--muted,#e5e7eb)"
            : "linear-gradient(135deg,#ff6b35,#e63000)",
          color: status === "sent" ? "var(--muted-foreground)" : "white",
        }}
      >
        {status === "loading" ? "…" : status === "sent" ? "✓ Sent" : "+ Add"}
      </button>
    </div>
  );
}

export default function SearchPeople() {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<SocialUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true); setSearched(true);
    try { setResults(await searchUsers(query.trim())); }
    catch { setResults([]); }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 sticky top-0 z-10"
        style={{ background: "var(--background,white)", borderBottom: "1px solid var(--border,rgba(0,0,0,0.06))" }}>
        <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--foreground)" }}>Find People</h1>
        <div className="flex items-center gap-2"
          style={{ background: "var(--muted,#f3f4f6)", borderRadius: 16, padding: "0 12px" }}>
          <span className="text-lg opacity-40">🔍</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Search by username..."
            className="flex-1 py-3 text-sm bg-transparent focus:outline-none"
            style={{ color: "var(--foreground)" }}
          />
          {query && (
            <button onClick={() => { setQuery(""); setResults([]); setSearched(false); }}
              className="opacity-40 hover:opacity-70 text-sm">✕</button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
          </div>
        ) : !searched ? (
          <div className="flex flex-col items-center py-16 gap-3 opacity-40">
            <span className="text-5xl">🔎</span>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Search for friends by username
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 opacity-40">
            <span className="text-5xl">😔</span>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No users found for "{query}"</p>
          </div>
        ) : (
          results.map(u => (
            <UserCard key={u.id} user={u} onAdd={() => {}} />
          ))
        )}
      </div>
    </div>
  );
}
