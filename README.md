# Forma

LIVE DEMO🌐🟢: formatrainer.netlify.app

**Forma** is a modern web app for personalized fitness coaching. Instead of generic workout plans from the internet, users answer a short questionnaire and get a routine tailored to their goals, experience, schedule, equipment, injuries, and preferences — then refine it with an in-app coach.

This project is designed as a **production-quality portfolio piece**: clean UX, scalable architecture, TypeScript end-to-end, and real auth + database — not a throwaway demo.


## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Database & migrations](#database--migrations)
- [Authentication](#authentication)
- [AI coach (local)](#ai-coach-local)
- [Exercise media (ExerciseDB)](#exercise-media-exercisedb)
- [Internationalization](#internationalization)
- [App routes](#app-routes)
- [API overview](#api-overview)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Cost model](#cost-model)
- [Roadmap](#roadmap)
- [Contributing / portfolio notes](#contributing--portfolio-notes)
- [License](#license)

---

## Features

| Area | What users get |
|------|----------------|
| **Onboarding** | Goal, level, days/week, session length, equipment, injuries, avoid-list, preferences |
| **Routines** | AI-generated multi-day plans stored in Postgres (days + exercises) |
| **Coach** | Structured “personal trainer” UI (not a free-form chatbot) to reshuffle, change volume/rest, swap machines → dumbbells, replace/explain exercises |
| **Manual editing** | Edit sets/reps/rest, reorder, swap from library/search, add/remove exercises |
| **Exercise library** | Browse/search with muscle filters; demo GIFs where verified |
| **Nutrition** | Local meal-plan generator (breakfast / lunch / dinner), water tracking, nutrition coach |
| **Calendar** | Per-routine check-ins (trained / rest / skipped), streak logic |
| **Profile** | Metrics & preferences |
| **i18n** | English (default) + Spanish toggle |
| **Theming** | Dark marketing/auth; light/dark toggle inside the app shell |

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | [Next.js](https://nextjs.org/) 16 (App Router) |
| UI | React 19, TypeScript, Tailwind CSS 4, Motion |
| Data fetching | TanStack Query |
| Auth & DB | [Supabase](https://supabase.com/) (Auth + Postgres + RLS) |
| Validation | Zod |
| Coach / plans | **Local deterministic generators** (no OpenAI / paid LLM) |
| Exercise GIFs | [ExerciseDB](https://oss.exercisedb.dev) free OSS API (attribution required; non-commercial) |

---

## Architecture

```
Browser
  └─ Next.js (App Router)
       ├─ (marketing)  landing
       ├─ (auth)       login / signup
       ├─ (app)        authenticated product UI
       └─ /api/*       Route Handlers (auth-gated where needed)
            ├─ local coach / nutrition builders
            ├─ Supabase (routines CRUD, profiles)
            └─ ExerciseDB (search / GIF proxy)
```

**Data model (high level)**

- **Postgres (RLS):** `profiles`, `routines`, `routine_days`, `exercises`
- **`profiles.preferences` (JSON):** onboarding answers, nutrition plans, water progress, workout calendar logs, coach chat prefs, active plan IDs — keeps MVP flexible without extra tables

**Auth gate:** `src/proxy.ts` refreshes the Supabase session and protects app routes (Next.js 16 proxy convention).

---

## Getting started

### Prerequisites

- Node.js 20+ (recommended)
- A free [Supabase](https://supabase.com) project
- npm

### Install

```bash
git clone https://github.com/<your-username>/forma.git
cd forma
npm install
cp .env.example .env.local
```

Fill in `.env.local` (see below), then run the SQL migrations in the Supabase SQL Editor.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
npm run build
npm start
```

---

## Environment variables

Copy [`.env.example`](.env.example):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (no `/rest/v1/` suffix) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon / publishable key (safe for the browser; RLS still applies) |

**Never commit** `.env.local` or any `sb_secret_…` / `service_role` key. The app only uses the public anon key.

---

## Database & migrations

Run these in **Supabase → SQL Editor → Run**, in order:

1. [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql)  
   Creates `profiles`, `routines`, `routine_days`, `exercises`, RLS policies, profile trigger on signup, and base grants.

2. [`supabase/migrations/002_fix_grants.sql`](supabase/migrations/002_fix_grants.sql)  
   Reinforces grants and backfills missing profiles (useful if you hit `permission denied` or users created before the trigger).

There is no required Supabase CLI workflow for this repo; manual SQL is enough for local + free-tier deploy.

---

## Authentication

Supported flows:

- **Email + password** (login / signup)
- **Google OAuth** (UI ready via “Continue with Google”)

### Local email tip

In Supabase → **Authentication → Providers → Email**, you can disable **Confirm email** while developing so signups work without an inbox.

### Google OAuth setup

1. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/).
2. In Supabase → **Authentication → Providers → Google**, paste Client ID / Secret.
3. Add Supabase’s callback URL to Google’s authorized redirect URIs (shown in the Supabase provider panel).
4. Ensure the app redirect after auth lands on `/auth/callback` (already implemented).

---

## AI coach (local)

Forma’s “AI” is a **local coaching engine** (`src/lib/ai/`, `src/lib/nutrition/`), not a paid LLM API.

It:

- Builds routines from onboarding constraints and a bilingual exercise catalog
- Applies **structured actions** (change days, volume, rest, reshuffle, replace exercise, explain, etc.)
- Generates nutrition plans with role-based meals (protein + carb + veg — avoids stacking grains)
- Always returns **structured data** the UI can persist

Free-text modification exists as a thin fallback and is intentionally limited; the product coach UX is the structured option tree.

---

## Exercise media (ExerciseDB)

- Verified Spanish/English catalog names map to real ExerciseDB IDs (`src/lib/exercisedb/client.ts`).
- Unverified exercises do **not** invent GIFs.
- GIFs are proxied through `/api/exercises/gif` for consistent loading.
- **Attribution / license:** ExerciseDB V1 free tier — credit AscendAPI / ExerciseDB; **non-commercial** use. See their docs before commercializing.

---

## Internationalization

- Locales: **`en` (default)** and **`es`**
- Toggle persists via `localStorage` + cookie `forma-locale`
- UI chrome: `src/lib/i18n/dictionaries.ts`
- Generated routines/meals/coach replies respect the active locale when created or regenerated

Existing saved content keeps the language it was generated in until the user regenerates.

---

## App routes

| Path | Description |
|------|-------------|
| `/` | Marketing landing |
| `/login`, `/signup` | Auth |
| `/auth/callback` | OAuth / email confirmation callback |
| `/onboarding` | Initial questionnaire → generate routine |
| `/routine`, `/routine/[id]` | Routine list & detail |
| `/routine/[id]/edit` | Manual editing |
| `/library` | Exercise library |
| `/nutrition`, `/nutrition/new`, `/nutrition/[id]` | Nutrition plans |
| `/calendar` | Workout check-ins & streaks |
| `/profile` | User profile / metrics |

---

## API overview

All sensitive mutations expect an authenticated Supabase session unless noted.

| Group | Endpoints |
|-------|-----------|
| AI / coach | `/api/ai/generate-routine`, `coach-chat`, `modify-routine`, `nutrition-coach-chat` |
| Routines | `/api/routines` |
| Exercises | `/api/exercises`, `reorder`, `search`, `library`, `lookup`, `gif` |
| Nutrition | `/api/nutrition`, `/api/nutrition/[id]`, `/api/nutrition/water` |
| Calendar | `/api/calendar` |
| Profile | `/api/profile/metrics` |

---

## Scripts

```bash
npm run dev      # development server
npm run build    # production build
npm start        # serve production build
npm run lint     # ESLint
```

---

## Project structure

```
forma/
├── public/                 # Brand assets, favicons
├── supabase/migrations/    # SQL schema + grants
├── src/
│   ├── app/
│   │   ├── (marketing)/    # Landing
│   │   ├── (auth)/         # Login / signup
│   │   ├── (app)/          # Authenticated product
│   │   ├── api/            # Route handlers
│   │   └── auth/callback/  # Auth callback
│   ├── components/         # UI by domain (routine, nutrition, calendar, …)
│   ├── lib/
│   │   ├── ai/             # Local coach + exercise catalog
│   │   ├── nutrition/      # Meal plans + nutrition coach
│   │   ├── exercises/      # Library search + muscle labels
│   │   ├── exercisedb/     # GIF / media resolution
│   │   ├── i18n/           # Dictionaries + locale helpers
│   │   ├── calendar/       # Streak logic
│   │   ├── routines/       # Persistence helpers
│   │   ├── supabase/       # Clients + session proxy
│   │   └── validations/    # Zod schemas
│   ├── proxy.ts            # Session middleware (Next 16)
│   └── types/              # Shared TS types / DB typings
├── .env.example
└── AGENTS.md               # Product vision for AI assistants
```

---

## Cost model

| Service | Cost for this MVP |
|---------|-------------------|
| Forma coach / nutrition generation | **Free** (runs on your server, no paid LLM) |
| Supabase Auth + Postgres | Free tier |
| ExerciseDB GIFs | Free OSS endpoint (attribution; non-commercial) |
| Hosting (e.g. Vercel) | Free hobby tier typically enough for a portfolio |

Users of the app do not need API keys.

---

## Roadmap

Ideas already anticipated by the product vision (`AGENTS.md`):

- Progress tracking & body-weight history
- Training stats and streaks beyond the calendar MVP
- Nutrition macros / meal plans with richer food data
- Smart reminders and multi-device sync
- Deeper coach explanations and progression prescriptions

The architecture (modular libs + JSON preferences + clear API boundaries) is meant to absorb these without a full rewrite.

---

## Contributing / portfolio notes

This repo is primarily a **personal portfolio product**. If you fork it:

1. Create your own Supabase project and never reuse someone else’s keys.
2. Run both SQL migrations.
3. Keep `.env.local` out of git (already covered by `.gitignore`).
4. Respect ExerciseDB’s attribution and non-commercial terms if you keep their media.

### Known polish items

- No automated test suite or CI workflow yet (add GitHub Actions for `lint` + `build` when you like).
- GIF proxy / lookup endpoints are intentionally lightweight for the demo; harden with auth or rate limits before heavy public traffic.

---

## License

MIT — see [`LICENSE`](LICENSE).

Exercise media remains subject to [ExerciseDB](https://oss.exercisedb.dev) / AscendAPI terms (attribution; typically non-commercial for the free tier).

---

## Credits

- **Product & engineering:** Forma
- **Exercise media:** [ExerciseDB](https://oss.exercisedb.dev) / AscendAPI
- **Inspiration (UX density & craft):** Linear, Notion, Raycast, Apple Fitness — applied to a simple fitness journey
