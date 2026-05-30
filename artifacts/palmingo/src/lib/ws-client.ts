/* WebSocket client + WebRTC manager for Palmingo social rooms */
import { getMyId, getMyUsername } from "./social";

/* ── Types ─────────────────────────────────────────── */
export type RoomEvent =
  | { type: "registered" }
  | { type: "room_joined"; roomId: string; members: OnlineMember[]; speakers: string[]; handRaised: string[]; targetLang: string }
  | { type: "member_online"; userId: string; username: string; role: string; muted: boolean; isOnStage: boolean; initiateOffer: boolean }
  | { type: "member_offline"; userId: string }
  | { type: "member_muted"; userId: string; muted: boolean }
  | { type: "member_kicked"; userId: string }
  | { type: "role_changed"; userId: string; role: string }
  | { type: "you_were_muted"; muted: boolean }
  | { type: "you_were_kicked"; roomId: string }
  | { type: "you_are_on_stage" }
  | { type: "you_are_in_audience" }
  | { type: "hand_raised"; userId: string; username: string }
  | { type: "hand_raised_broadcast"; userId: string }
  | { type: "hand_lowered"; userId: string }
  | { type: "speaker_added"; userId: string; username: string }
  | { type: "speaker_removed"; userId: string }
  | { type: "new_message"; message: WsMessage }
  | { type: "new_dm"; message: DmMessage; delivered?: boolean }
  | { type: "error"; message: string }
  | { type: "connected" }
  | { type: "disconnected" };

export interface OnlineMember {
  userId: string; username: string | null; name: string | null;
  role: "admin" | "moderator" | "member";
  muted: boolean; online: boolean;
  isOnStage: boolean; hasHandRaised: boolean;
}

export interface WsMessage {
  id: string; roomId: string; userId: string | null;
  username: string | null; content: string;
  type: "text" | "system" | "challenge"; createdAt: string;
}

export interface DmMessage {
  id: string; fromId: string; toId: string;
  fromUsername?: string;
  content: string; msgType: "text" | "room_share";
  roomId?: string; roomName?: string; inviteCode?: string;
  read: boolean; createdAt: string;
}

type EventHandler = (event: RoomEvent) => void;

/* ── WebRTC ─────────────────────────────────────────── */
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

/* ── PalmWsClient ───────────────────────────────────── */
export class PalmWsClient {
  private ws:              WebSocket | null = null;
  private handlers:        EventHandler[]   = [];
  private reconnectTimer:  ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect  = true;
  private currentRoom:     string | null    = null;
  private peers            = new Map<string, RTCPeerConnection>();
  private localStream:     MediaStream | null = null;
  private remoteStreams     = new Map<string, MediaStream>();
  private onRemoteStream?: (peerId: string, stream: MediaStream | null) => void;

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    this.shouldReconnect = true;
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    this.ws = new WebSocket(`${proto}//${window.location.host}/api/ws`);

    this.ws.onopen = () => {
      this.emit({ type: "connected" });
      this.register();
      if (this.currentRoom) this.joinRoom(this.currentRoom);
    };
    this.ws.onmessage = (e) => {
      try { this.handleServerMsg(JSON.parse(e.data as string)); } catch {}
    };
    this.ws.onclose = () => {
      this.emit({ type: "disconnected" });
      if (this.shouldReconnect) this.reconnectTimer = setTimeout(() => this.connect(), 3000);
    };
    this.ws.onerror = () => { this.ws?.close(); };
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.closeAllPeers();
    this.ws?.close();
    this.ws = null;
  }

  on(handler: EventHandler) {
    this.handlers.push(handler);
    return () => { this.handlers = this.handlers.filter(h => h !== handler); };
  }

  private emit(event: RoomEvent) { for (const h of this.handlers) h(event); }

  private send(data: object) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(data));
  }

  private register() {
    const userId = getMyId(); const username = getMyUsername();
    if (userId && username) this.send({ type: "register", userId, username });
  }

  /* ── Room actions ─────────────────────────────────── */
  joinRoom(roomId: string) { this.currentRoom = roomId; this.send({ type: "join_room", roomId }); }
  leaveRoom(roomId: string) { this.currentRoom = null; this.send({ type: "leave_room", roomId }); this.closeAllPeers(); }
  sendChat(roomId: string, content: string) { this.send({ type: "chat", roomId, content }); }
  muteUser(roomId: string, targetId: string, muted: boolean) { this.send({ type: "mute", roomId, targetId, muted }); }
  kickUser(roomId: string, targetId: string) { this.send({ type: "kick", roomId, targetId }); }
  setRole(roomId: string, targetId: string, role: "moderator" | "member") { this.send({ type: "set_role", roomId, targetId, role }); }
  requestChallenge(roomId: string) { this.send({ type: "challenge", roomId }); }

  /* ── Stage/Audience ───────────────────────────────── */
  raiseHand(roomId: string)                     { this.send({ type: "raise_hand", roomId }); }
  lowerHand(roomId: string)                     { this.send({ type: "lower_hand", roomId }); }
  approveSpeaker(roomId: string, targetId: string)  { this.send({ type: "approve_speaker", roomId, targetId }); }
  removeSpeaker(roomId: string, targetId: string)   { this.send({ type: "remove_speaker", roomId, targetId }); }
  stepDown(roomId: string)                      { this.send({ type: "step_down", roomId }); }

  /* ── Direct Messages ──────────────────────────────── */
  sendDM(toId: string, content: string, roomShare?: { roomId: string; roomName: string; inviteCode: string }) {
    this.send({ type: "dm", toId, content, ...roomShare });
  }

  /* ── WebRTC ───────────────────────────────────────── */
  setOnRemoteStream(cb: (peerId: string, stream: MediaStream | null) => void) { this.onRemoteStream = cb; }

  async startAudio(): Promise<MediaStream | null> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      return this.localStream;
    } catch { return null; }
  }

  stopAudio() { this.localStream?.getTracks().forEach(t => t.stop()); this.localStream = null; }
  setMicEnabled(enabled: boolean) { this.localStream?.getAudioTracks().forEach(t => { t.enabled = enabled; }); }

  private async createPeer(peerId: string, initiator: boolean) {
    if (this.peers.has(peerId)) return this.peers.get(peerId)!;
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.peers.set(peerId, pc);
    if (this.localStream) for (const t of this.localStream.getTracks()) pc.addTrack(t, this.localStream);
    const remoteStream = new MediaStream();
    this.remoteStreams.set(peerId, remoteStream);
    pc.ontrack = (e) => {
      for (const t of e.streams[0]?.getTracks() ?? []) remoteStream.addTrack(t);
      this.onRemoteStream?.(peerId, remoteStream);
    };
    pc.onicecandidate = (e) => {
      if (e.candidate) this.send({ type: "rtc_ice", roomId: this.currentRoom!, toId: peerId, candidate: e.candidate });
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") this.closePeer(peerId);
    };
    if (initiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.send({ type: "rtc_offer", roomId: this.currentRoom!, toId: peerId, offer });
    }
    return pc;
  }

  private async handleOffer(fromId: string, offer: RTCSessionDescriptionInit) {
    const pc = await this.createPeer(fromId, false);
    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    this.send({ type: "rtc_answer", roomId: this.currentRoom!, toId: fromId, answer });
  }

  private async handleAnswer(fromId: string, answer: RTCSessionDescriptionInit) {
    const pc = this.peers.get(fromId);
    if (pc && pc.signalingState !== "stable") await pc.setRemoteDescription(answer);
  }

  private async handleIce(fromId: string, candidate: RTCIceCandidateInit) {
    const pc = this.peers.get(fromId);
    if (pc) await pc.addIceCandidate(candidate).catch(() => {});
  }

  private closePeer(peerId: string) {
    this.peers.get(peerId)?.close();
    this.peers.delete(peerId);
    this.remoteStreams.delete(peerId);
    this.onRemoteStream?.(peerId, null);
  }

  private closeAllPeers() { for (const id of [...this.peers.keys()]) this.closePeer(id); }

  /* ── Server message router ────────────────────────── */
  private async handleServerMsg(msg: Record<string, unknown>) {
    switch (msg.type) {
      case "registered":        this.emit({ type: "registered" }); break;
      case "room_joined":       this.emit(msg as unknown as RoomEvent); break;
      case "member_online":     {
        const ev = msg as { userId: string; username: string; role: string; muted: boolean; isOnStage: boolean; initiateOffer: boolean };
        this.emit({ type: "member_online", ...ev });
        if (ev.initiateOffer && this.localStream) await this.createPeer(ev.userId, true);
        break;
      }
      case "member_offline":    this.emit({ type: "member_offline", userId: msg.userId as string }); this.closePeer(msg.userId as string); break;
      case "member_muted":      this.emit({ type: "member_muted", userId: msg.userId as string, muted: msg.muted as boolean }); break;
      case "member_kicked":     this.emit({ type: "member_kicked", userId: msg.userId as string }); this.closePeer(msg.userId as string); break;
      case "role_changed":      this.emit({ type: "role_changed", userId: msg.userId as string, role: msg.role as string }); break;
      case "you_were_muted":    this.emit({ type: "you_were_muted", muted: msg.muted as boolean }); this.setMicEnabled(!(msg.muted as boolean)); break;
      case "you_were_kicked":   this.emit({ type: "you_were_kicked", roomId: msg.roomId as string }); this.closeAllPeers(); this.currentRoom = null; break;
      case "you_are_on_stage":  this.emit({ type: "you_are_on_stage" }); break;
      case "you_are_in_audience": this.emit({ type: "you_are_in_audience" }); break;
      case "hand_raised":       this.emit({ type: "hand_raised", userId: msg.userId as string, username: msg.username as string }); break;
      case "hand_raised_broadcast": this.emit({ type: "hand_raised_broadcast", userId: msg.userId as string }); break;
      case "hand_lowered":      this.emit({ type: "hand_lowered", userId: msg.userId as string }); break;
      case "speaker_added":     this.emit({ type: "speaker_added", userId: msg.userId as string, username: msg.username as string }); break;
      case "speaker_removed":   this.emit({ type: "speaker_removed", userId: msg.userId as string }); break;
      case "new_message":       this.emit({ type: "new_message", message: msg.message as WsMessage }); break;
      case "new_dm":            this.emit({ type: "new_dm", message: msg.message as DmMessage, delivered: msg.delivered as boolean | undefined }); break;
      case "rtc_offer":         await this.handleOffer(msg.fromId as string, msg.offer as RTCSessionDescriptionInit); break;
      case "rtc_answer":        await this.handleAnswer(msg.fromId as string, msg.answer as RTCSessionDescriptionInit); break;
      case "rtc_ice":           await this.handleIce(msg.fromId as string, msg.candidate as RTCIceCandidateInit); break;
      case "error":             this.emit({ type: "error", message: msg.message as string }); break;
    }
  }
}

export const wsClient = new PalmWsClient();
