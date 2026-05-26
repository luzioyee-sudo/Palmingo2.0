---
name: Social Platform Architecture
description: Learn with Friends — friend system, voice rooms, WebRTC, WebSocket, AI challenges
---

## Auth model
No backend sessions. `palmingo:social-id` (UUID, `crypto.randomUUID()`) stored in localStorage.
Sent as `x-social-id` header on every social API call. Server validates UUID format before use.

## WebSocket
- Path: `/api/ws` — attached to the HTTP server via `attachWebSocket()` in `artifacts/api-server/src/lib/ws-server.ts`
- `artifacts/api-server/src/index.ts` uses `http.createServer(app)` + `attachWebSocket(httpServer)` instead of `app.listen()`
- Frontend singleton: `wsClient` in `artifacts/palmingo/src/lib/ws-client.ts`

**Why:** WebSocket must share the same HTTP server (port 8080); WS upgrade can't go to a separate port through Replit proxy.

## WebRTC topology
Full mesh (each peer connects to all others). Google STUN servers only — no TURN.
Server relays signaling (offer/answer/ICE) but does not participate in media.

**How to apply:** When a user joins a room, existing members receive `member_online` with `initiateOffer: true` and create RTCPeerConnection + send offer to the new member.

## DB schema (lib/db/src/schema/social.ts)
Tables: `social_users`, `friendships`, `rooms`, `room_members`, `room_messages`
Enums: `friendship_status`, `room_type`, `member_role`, `msg_type`

**Why:** Composite lib `@workspace/db` must be built with `pnpm run typecheck:libs` before api-server typecheck works.

## UUID validation
`x-social-id` header must be validated as UUID before using in Drizzle queries (uuid pg type rejects non-UUID strings with runtime error).
Fixed in `artifacts/api-server/src/routes/social.ts` via `isValidUUID()` helper.

## Admin controls
Mute/kick via WebSocket messages (`mute`, `kick`, `set_role`). DB is updated immediately server-side.
The muted user receives `you_were_muted` and their mic track is disabled client-side.
