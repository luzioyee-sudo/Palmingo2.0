---
name: Palmingo architecture
description: Key non-obvious decisions for the Palmingo language learning app that aren't obvious from reading the code.
---

# Palmingo App Architecture

## Auth
Pure localStorage — no backend auth. `palmingo:user` key holds the full user object. `useAuth()` from `lib/auth.tsx`.

## Routing
wouter with `base={import.meta.env.BASE_URL.replace(/\/$/, "")}`. `/tutor` redirects to `/laxa` — the Tutor component lives at `/laxa` (full-screen, no padding via `isLaxa` flag in AppShell).

## Dark Mode
CSS class-based: `document.documentElement.classList.toggle("dark", flag)` + `localStorage("palmingo:theme")`. **Not** next-themes (dep exists but unused for this).

## AI Routes
All 8 routes are in `artifacts/api-server/src/routes/ai.ts`, registered via `router.use(aiRouter)` in `routes/index.ts`. Paths are `/api/ai/dictionary`, `/api/ai/translate`, `/api/ai/tutor`, `/api/ai/transcript`, `/api/ai/search-youtube`, `/api/ai/grammar`, `/api/ai/youtube-captions`, `/api/ai/tts`.

**Why:** The api-server uses a nested router pattern — `app.use("/api", router)` and `router.use(aiRouter)`, so routes are effectively `/api/ai/*`.

## Runtime Dependencies (critical)
- `@google/generative-ai` must be in `dependencies` of api-server (runtime, not devDeps)
- `react-markdown` + `remark-gfm` must be in `dependencies` of palmingo (not devDeps)

## Palm Stage
`palmStage(xp) = Math.floor(xp / 50)`, capped at 6. 7 stages: Seed → Sprout → Sapling → Young Palm → Growing → Lush → Majestic.

## HeyLaxa Voice Assistant
Global wake-word ("hey laxa" / Arabic variants) that calls `/api/ai/tutor` for a 1-2 sentence answer. Automatically stops on `/laxa` page (Tutor handles its own voice).

## Gemini Models
- Chat: `gemini-2.5-flash`
- TTS: `gemini-2.5-flash-preview-tts` (different model, audio modality)
