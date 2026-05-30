/* Social API client — all calls go through /api/social/ */

const BASE = "/api/social";

function socialId(): string | null { return localStorage.getItem("palmingo:social-id"); }

function headers(): HeadersInit {
  const id = socialId();
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (id) (h as Record<string, string>)["x-social-id"] = id;
  return h;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, headers: headers() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(err.error ?? "request failed"), { status: res.status, data: err });
  }
  return res.json() as Promise<T>;
}

/* ── Types ─────────────────────────────────────────── */
export interface SocialUser {
  id: string; username: string; name: string;
  xp: number; streak: number; level: string;
}

export interface Friendship {
  id: string; requesterId: string; addresseeId: string;
  status: "pending" | "accepted" | "rejected";
  other: SocialUser | null;
  direction: "sent" | "received";
}

export interface Room {
  id: string; name: string; type: "war" | "voice";
  adminId: string; inviteCode: string;
  maxMembers: number; isPublic: boolean;
  targetLang: string; createdAt: string;
  memberCount?: number; isMember?: boolean;
}

export interface RoomMember {
  userId: string; username: string | null; name: string | null;
  role: "admin" | "moderator" | "member"; muted: boolean;
  online?: boolean; isOnStage?: boolean; hasHandRaised?: boolean;
}

export interface RoomDetail extends Room { members: RoomMember[] }

export interface RoomMessage {
  id: string; roomId: string; userId: string | null;
  username: string | null; content: string;
  type: "text" | "system" | "challenge"; createdAt: string;
}

export interface Post {
  id: string; authorId: string; content: string;
  imageUrl?: string | null; postType: "text" | "image" | "room_share";
  roomId?: string | null; roomName?: string | null; inviteCode?: string | null;
  likesCount: number; liked: boolean; createdAt: string;
  authorUsername?: string | null; authorName?: string | null;
  authorXp?: number; authorLevel?: string;
}

export interface DmMessage {
  id: string; fromId: string; toId: string;
  fromUsername?: string;
  content: string; msgType: "text" | "room_share";
  roomId?: string | null; roomName?: string | null; inviteCode?: string | null;
  read: boolean; createdAt: string;
}

export interface Conversation {
  friend: SocialUser;
  lastMessage: DmMessage | null;
  unreadCount: number;
}

/* ── Auth ──────────────────────────────────────────── */
export function getMyId(): string | null { return socialId(); }
export function getMyUsername(): string | null { return localStorage.getItem("palmingo:username"); }

export async function registerUser(opts: {
  id: string; username: string; name: string;
  xp: number; streak: number; level: string;
}): Promise<SocialUser> {
  const user = await apiFetch<SocialUser>("/register", {
    method: "POST", body: JSON.stringify(opts),
  });
  localStorage.setItem("palmingo:social-id", user.id);
  localStorage.setItem("palmingo:username", user.username);
  return user;
}

/* ── Users ─────────────────────────────────────────── */
export function searchUsers(q: string) { return apiFetch<SocialUser[]>(`/users/search?q=${encodeURIComponent(q)}`); }
export function getUser(id: string) { return apiFetch<SocialUser>(`/users/${id}`); }

/* ── Friends ───────────────────────────────────────── */
export function getFriends() { return apiFetch<Friendship[]>("/friends"); }
export function sendFriendRequest(addresseeId: string) {
  return apiFetch<Friendship>("/friends/request", { method: "POST", body: JSON.stringify({ addresseeId }) });
}
export function respondToFriend(friendshipId: string, accept: boolean) {
  return apiFetch<Friendship>("/friends/respond", { method: "POST", body: JSON.stringify({ friendshipId, accept }) });
}
export function removeFriend(friendshipId: string) {
  return apiFetch<{ ok: boolean }>(`/friends/${friendshipId}`, { method: "DELETE" });
}

/* ── Rooms ─────────────────────────────────────────── */
export function getRooms() { return apiFetch<Room[]>("/rooms"); }
export function getRoomDetail(id: string) { return apiFetch<RoomDetail>(`/rooms/${id}`); }
export function createRoom(opts: { name: string; type: "war" | "voice"; isPublic: boolean; maxMembers: number; targetLang: string }) {
  return apiFetch<Room>("/rooms", { method: "POST", body: JSON.stringify(opts) });
}
export function joinRoomByCode(inviteCode: string) {
  return apiFetch<Room>("/rooms/join", { method: "POST", body: JSON.stringify({ inviteCode }) });
}
export function leaveRoom(roomId: string) { return apiFetch<{ ok: boolean }>(`/rooms/${roomId}/leave`, { method: "POST" }); }
export function deleteRoom(roomId: string) { return apiFetch<{ ok: boolean }>(`/rooms/${roomId}`, { method: "DELETE" }); }
export function getRoomMessages(roomId: string) { return apiFetch<RoomMessage[]>(`/rooms/${roomId}/messages`); }
export function updateMember(roomId: string, memberId: string, opts: { role?: "moderator" | "member"; muted?: boolean }) {
  return apiFetch(`/rooms/${roomId}/members/${memberId}`, { method: "PUT", body: JSON.stringify(opts) });
}
export function kickMember(roomId: string, targetUserId: string) {
  return apiFetch(`/rooms/${roomId}/members/${targetUserId}`, { method: "DELETE" });
}

/* ── Posts ─────────────────────────────────────────── */
export function getPosts(limit = 30) { return apiFetch<Post[]>(`/posts?limit=${limit}`); }
export function createPost(data: {
  content: string; postType?: "text" | "image" | "room_share";
  imageUrl?: string; roomId?: string; roomName?: string; inviteCode?: string;
}) {
  return apiFetch<Post>("/posts", { method: "POST", body: JSON.stringify(data) });
}
export function toggleLike(postId: string) {
  return apiFetch<{ liked: boolean; likesCount: number }>(`/posts/${postId}/like`, { method: "POST" });
}
export function deletePost(postId: string) {
  return apiFetch<{ ok: boolean }>(`/posts/${postId}`, { method: "DELETE" });
}

/* ── Messages ──────────────────────────────────────── */
export function getConversations() { return apiFetch<Conversation[]>("/conversations"); }
export function getMessages(friendId: string) { return apiFetch<DmMessage[]>(`/messages/${friendId}`); }
export function sendMessage(toId: string, content: string, roomShare?: { roomId: string; roomName: string; inviteCode: string }) {
  return apiFetch<DmMessage>("/messages", { method: "POST", body: JSON.stringify({ toId, content, ...roomShare }) });
}
