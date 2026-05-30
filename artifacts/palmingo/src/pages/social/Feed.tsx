import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  getPosts, createPost, toggleLike, deletePost,
  getMyId, type Post,
} from "@/lib/social";

/* ── Post Card ─────────────────────────────────────── */
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Avatar({ name }: { name?: string | null }) {
  const initials = (name ?? "?").slice(0, 2).toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm text-white flex-shrink-0"
      style={{ background: "linear-gradient(135deg, #ff6b35 0%, #e63000 100%)" }}>
      {initials}
    </div>
  );
}

function RoomShareCard({ post, onJoin }: { post: Post; onJoin: () => void }) {
  return (
    <div className="mx-4 mb-3 rounded-2xl overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1a0a3e 0%, #0d0828 100%)", border: "1px solid rgba(255,107,53,0.2)" }}>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🎙️</span>
          <div>
            <p className="text-white font-semibold text-sm">{post.roomName ?? "Voice Room"}</p>
            <p className="text-white/40 text-xs">Voice Room · Tap to join</p>
          </div>
        </div>
        <button
          onClick={onJoin}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#ff6b35,#e63000)" }}
        >
          Join Room
        </button>
      </div>
    </div>
  );
}

function PostCard({ post, myId, onLike, onDelete, onJoinRoom }: {
  post: Post; myId: string | null;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
  onJoinRoom: (post: Post) => void;
}) {
  const isOwn = post.authorId === myId;

  return (
    <article className="rounded-2xl overflow-hidden mb-3 mx-4"
      style={{ background: "var(--card,white)", border: "1px solid var(--border,rgba(0,0,0,0.06))", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
      {/* Author row */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <Avatar name={post.authorName ?? post.authorUsername} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
            {post.authorName ?? post.authorUsername ?? "Unknown"}
          </p>
          <p className="text-xs" style={{ color: "var(--muted-foreground,#6b7280)" }}>
            @{post.authorUsername} · {timeAgo(post.createdAt)}
          </p>
        </div>
        {isOwn && (
          <button onClick={() => onDelete(post.id)} className="text-xs opacity-40 hover:opacity-70 px-2 py-1 rounded-lg">
            🗑
          </button>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <p className="px-4 pb-3 text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
          {post.content}
        </p>
      )}

      {/* Image */}
      {post.postType === "image" && post.imageUrl && (
        <img src={post.imageUrl} alt="" className="w-full object-cover max-h-64" />
      )}

      {/* Room share */}
      {post.postType === "room_share" && (
        <RoomShareCard post={post} onJoin={() => onJoinRoom(post)} />
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 px-4 py-3"
        style={{ borderTop: "1px solid var(--border,rgba(0,0,0,0.05))" }}>
        <button
          onClick={() => onLike(post.id)}
          className="flex items-center gap-1.5 text-sm font-medium transition-all duration-150"
          style={{ color: post.liked ? "#ff6b35" : "var(--muted-foreground,#6b7280)" }}
        >
          <span className="text-base" style={{ transform: post.liked ? "scale(1.15)" : "scale(1)", transition: "transform 0.15s" }}>
            {post.liked ? "❤️" : "🤍"}
          </span>
          {post.likesCount > 0 && <span>{post.likesCount}</span>}
        </button>
      </div>
    </article>
  );
}

/* ── Create Post Modal ─────────────────────────────── */
function CreatePostModal({ onClose, onPosted }: { onClose: () => void; onPosted: (p: Post) => void }) {
  const [content, setContent] = useState("");
  const [type, setType]       = useState<"text" | "image">("text");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading]  = useState(false);

  const submit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const post = await createPost({
        content: content.trim(),
        postType: type,
        imageUrl: type === "image" ? imageUrl : undefined,
      });
      onPosted(post);
      onClose();
    } catch { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-6 space-y-4"
        style={{ background: "var(--background,white)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Create Post</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "var(--muted,#f3f4f6)" }}>
            ✕
          </button>
        </div>

        {/* Type selector */}
        <div className="flex gap-2">
          {(["text", "image"] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              className="flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-all"
              style={{
                background: type === t ? "linear-gradient(135deg,#ff6b35,#e63000)" : "var(--muted,#f3f4f6)",
                color: type === t ? "white" : "var(--muted-foreground,#6b7280)",
              }}>
              {t === "text" ? "📝 Text" : "🖼 Image"}
            </button>
          ))}
        </div>

        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="What's on your mind?"
          rows={4}
          className="w-full rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none"
          style={{
            background: "var(--muted,#f9fafb)",
            border: "1px solid var(--border,rgba(0,0,0,0.08))",
            color: "var(--foreground)",
          }}
        />

        {type === "image" && (
          <input
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="Image URL (https://...)"
            className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
            style={{
              background: "var(--muted,#f9fafb)",
              border: "1px solid var(--border,rgba(0,0,0,0.08))",
              color: "var(--foreground)",
            }}
          />
        )}

        <button
          onClick={submit}
          disabled={!content.trim() || loading}
          className="w-full py-3 rounded-2xl text-sm font-semibold text-white transition-all"
          style={{ background: content.trim() ? "linear-gradient(135deg,#ff6b35,#e63000)" : "var(--muted,#e5e7eb)" }}
        >
          {loading ? "Posting…" : "Share Post"}
        </button>
      </div>
    </div>
  );
}

/* ── Feed page ─────────────────────────────────────── */
export default function Feed() {
  const [, navigate] = useLocation();
  const myId         = getMyId();
  const [posts, setPosts]   = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setPosts(await getPosts(50)); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleLike = async (postId: string) => {
    const prev = posts;
    setPosts(ps => ps.map(p => p.id === postId
      ? { ...p, liked: !p.liked, likesCount: p.likesCount + (p.liked ? -1 : 1) }
      : p
    ));
    try { await toggleLike(postId); } catch { setPosts(prev); }
  };

  const handleDelete = async (postId: string) => {
    setPosts(ps => ps.filter(p => p.id !== postId));
    await deletePost(postId).catch(() => {});
  };

  const handleJoinRoom = (post: Post) => {
    if (post.roomId) navigate(`/rooms/${post.roomId}`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 sticky top-0 z-10"
        style={{ background: "var(--background,white)", borderBottom: "1px solid var(--border,rgba(0,0,0,0.06))" }}>
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Feed</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white"
          style={{ background: "linear-gradient(135deg,#ff6b35,#e63000)" }}
        >
          ✏️
        </button>
      </div>

      {/* Posts */}
      <div className="flex-1 overflow-y-auto py-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 opacity-50">
            <span className="text-5xl">📭</span>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No posts yet. Be the first!</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard key={post.id} post={post} myId={myId}
              onLike={handleLike} onDelete={handleDelete} onJoinRoom={handleJoinRoom} />
          ))
        )}
      </div>

      {showCreate && (
        <CreatePostModal
          onClose={() => setShowCreate(false)}
          onPosted={(p) => setPosts(prev => [p, ...prev])}
        />
      )}
    </div>
  );
}
