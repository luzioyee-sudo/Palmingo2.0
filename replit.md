# Palmingo

AI-powered language learning app with voice flashcards, a real-time Gemini tutor (Laxa), smart dictionary, YouTube video hub, and a growing palm tree that tracks your XP.

## Run & Operate

- `pnpm --filter @workspace/palmingo run dev` — run the Palmingo frontend (port 20088, previewPath `/`)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, paths `/api`)
- `pnpm run typecheck` — full typecheck across all packages
- Required env: `GEMINI_API_KEY` — Google Gemini API key (AI features: tutor, dictionary, TTS, YouTube search)
- Required env: `SESSION_SECRET` — already configured

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind v4 + Framer Motion + wouter (routing)
- API: Express 5 + Gemini 2.5 Flash (`@google/generative-ai`)
- Auth: pure localStorage (no backend — see `artifacts/palmingo/src/lib/auth.tsx`)
- State/persistence: localStorage keys `palmingo:progress`, `palmingo:flashcards`, `palmingo:decks-v2`, `palmingo:conversations`, `palmingo:dict-history`
- Dark mode: CSS class-based (`document.documentElement.classList.toggle("dark", …)`) — NOT next-themes despite the dep
- Fonts: Space Grotesk (display) + Inter (body) — loaded from Google Fonts via index.html

## Where things live

- `artifacts/palmingo/src/` — all React source
  - `lib/` — auth.tsx, i18n.ts (7 langs), theme.ts (BRAND_ORANGE), flashcards.ts (SM-2 + preset decks), conversations.ts, progress.ts, speech.ts, utils.ts
  - `pages/` — Landing, Login, Onboarding, Home (redirects to Index), Index, Flashcards, Tutor (→ /laxa), Dictionary, Videos, Progress, Chunks, Profile, Settings, not-found
  - `components/` — AppShell (sidebar + mobile nav), Logo (PalmLogo + AIOrb), YourPalm (beach SVG scene), HeyLaxa (voice wake-word), Markdown, PageTransition, DemoScreens, FeatureFilm
  - `components/ui/` — 55 shadcn/ui components
- `artifacts/api-server/src/routes/ai.ts` — all 8 Gemini-powered endpoints
- `artifacts/palmingo/src/index.css` — Palmingo/Laxa design system (brand vars, glass utilities, dark mode)

## Architecture decisions

- Auth is pure localStorage (no DB, no sessions) — `palmingo:user` key holds the full user object
- Routing: wouter with `base={import.meta.env.BASE_URL}` — all in-app routes are SPA
- `/tutor` redirects to `/laxa` — the Tutor component is mounted at `/laxa`
- AI routes are all prefixed `/api/ai/*` (not `/api/*`) — registered in `routes/index.ts` via `router.use(aiRouter)`
- Dark mode is toggled by adding/removing the `dark` CSS class on `<html>` and persisted to `localStorage("palmingo:theme")`
- YourPalm palm stage = `Math.floor(xp / 50)`, capped at 6 (7 stages: Seed → Majestic)

## Product

- **Landing** — marketing page with animated demo screens (TutorDemo, VideoDemo, FlashcardsDemo, DictionaryDemo, ProgressDemo)
- **Login/Onboarding** — localStorage auth, multi-step onboarding capturing goal/country/age/language/level
- **Home (Index)** — dashboard with YourPalm beach scene, XP/streak stats, weekly activity bars, feature film cards
- **Flashcards** — SM-2 spaced repetition, 6 preset English/Arabic decks, custom deck creation, voice pronunciation
- **Laxa AI Tutor** — full-screen chat with Gemini 2.5, voice input/output via Web Speech API + Gemini TTS, grammar correction, scenario-based conversations
- **Dictionary** — AI-powered lookup with IPA, translation, meaning, 3 CEFR-levelled example sentences, save-to-flashcard
- **Videos** — YouTube search (no API key needed — scrapes ytInitialData), in-app player, tap-any-word AI translation
- **Chunks** — topic-grouped lesson cards that launch Tutor with a preset scenario
- **HeyLaxa** — global voice wake-word assistant ("hey laxa" / "لاكسا"), responds with 1-2 sentences from any page

## Gotchas

- `@google/generative-ai` must be in `dependencies` (not devDependencies) of api-server — it's needed at runtime
- `react-markdown` and `remark-gfm` must be in `dependencies` of palmingo (not devDependencies) for Vite SSR compat
- The `/laxa` route is full-height with no padding (`isLaxa` flag in AppShell) — do not wrap it in the standard page padding
- HeyLaxa stops when on `/laxa` (the Tutor page handles its own voice)
- The Gemini TTS model is `gemini-2.5-flash-preview-tts` (different from chat model `gemini-2.5-flash`)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
