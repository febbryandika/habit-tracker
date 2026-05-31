# Habit Tracker

A personal habit tracking app where authenticated users define daily habits, log completions, track streaks, and view progress on a GitHub-style 12-week heatmap.

> See [SPEC.md](SPEC.md) for the full technical specification — data model, API contract, streak algorithm, auth config, and security invariants.

---

## Features

- **Auth** — email + password register / login / logout via better-auth
- **Habit CRUD** — create, edit, archive, restore, delete; drag-to-reorder
- **Completion toggle** — idempotent daily toggle per habit; supports up to 7 days back
- **Streaks** — current streak and longest streak, computed server-side
- **12-week heatmap** — GitHub-style 84-cell grid, colour-coded by completion
- **Dashboard** — today's habits with completion status and streak badges

---

## Screenshots

| Login | Register |
|---|---|
| ![Login page](docs/screenshots/01-login.png) | ![Register page](docs/screenshots/02-register.png) |

**Dashboard** — today's habits with streak badges and completion toggles. Three habits marked done (filled ring), one pending.

![Dashboard](docs/screenshots/03-dashboard.png)

**Habits list** — all habits with drag-to-reorder, edit, archive, and delete actions.

![Habits list](docs/screenshots/04-habits-list.png)

**Habit detail** — 12-week heatmap and stats cards (current streak, longest streak, completion rate, total completions).

![Habit detail with heatmap](docs/screenshots/05-habit-detail.png)

**New habit form** — name, emoji picker, and colour swatches.

![New habit form](docs/screenshots/06-new-habit.png)

---

## Stack

| Layer | Technology | Why |
|---|---|---|
| Runtime & package manager | [Bun](https://bun.sh) | Single fast runtime for both server and tooling; native TypeScript without a build step |
| API framework | [Hono](https://hono.dev) | Minimal, edge-ready, and ships a typed RPC client that gives end-to-end type safety without code generation |
| Auth | [better-auth](https://better-auth.com) | Full-featured email/password auth with a Drizzle adapter; no lock-in |
| Database | [Neon](https://neon.tech) Postgres + [Drizzle ORM](https://orm.drizzle.team) | Serverless Postgres with a great DX; Drizzle keeps queries type-safe and migrations version-controlled |
| Frontend framework | React 19 + [Vite](https://vitejs.dev) | Concurrent features, server components-ready; Vite for instant HMR |
| Routing | [TanStack Router](https://tanstack.com/router) | File-based routing with full type safety on params and search |
| Server state | [TanStack Query](https://tanstack.com/query) | Declarative data fetching with optimistic update primitives |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) | Utility-first; v4 drops config files for CSS-native setup |
| Validation | [Zod](https://zod.dev) | Schema-first validation shared across backend and frontend via a `backend/validation` subpath export |
| Drag & drop | [dnd-kit](https://dndkit.com) | Accessible by default; `KeyboardSensor` ships out of the box |

---

## Project Structure

```
habit-tracker/
├── backend/                  # Hono API (Bun)
│   ├── src/
│   │   ├── index.ts          # App entry — mounts routes, exports AppType for RPC
│   │   ├── routes/
│   │   │   ├── habits.ts     # CRUD + stats + reorder
│   │   │   ├── logs.ts       # Completion toggle
│   │   │   └── dashboard.ts  # Today's habits with completion status
│   │   ├── db/
│   │   │   ├── schema.ts     # Drizzle table definitions + inferred types
│   │   │   └── index.ts      # db instance (Neon serverless driver)
│   │   └── lib/
│   │       ├── validation.ts # Shared Zod schemas + constants (no server deps)
│   │       ├── auth.ts       # better-auth setup
│   │       ├── middleware.ts # requireAuth, requestLogger
│   │       ├── errors.ts     # Standardised error envelope + validate() wrapper
│   │       ├── streaks.ts    # computeStreaks() — current + longest streak
│   │       └── rate-limit.ts # Auth route rate limiter
│   └── drizzle/              # Migration files
├── frontend/                 # React 19 + Vite
│   └── src/
│       ├── routes/           # File-based TanStack Router pages
│       ├── components/       # HabitCard, HabitForm, Heatmap, HabitStats, …
│       ├── hooks/            # useHabits, useToggleCompletion
│       └── lib/
│           ├── client.ts     # Hono RPC client (typed from AppType)
│           ├── auth-client.ts
│           ├── habit-schemas.ts  # Form validation (imports constants from backend/validation)
│           └── query-client.ts
├── e2e/                      # Playwright end-to-end tests
├── SPEC.md                   # Authoritative technical specification
└── package.json              # Bun workspace root
```

---

## Setup

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.0
- A [Neon](https://neon.tech) Postgres database (free tier is enough)

### 1. Install dependencies

```bash
bun install
```

### 2. Configure the backend environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
# Neon Postgres connection string (from the Neon console)
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

# Random secret for better-auth session signing
# Generate one with: openssl rand -base64 32
BETTER_AUTH_SECRET=replace-with-a-random-secret

# Backend origin (used by better-auth for CORS / cookie binding)
BETTER_AUTH_URL=http://localhost:3000
```

### 3. Run migrations

```bash
bun run --cwd backend db:migrate
```

### 4. Start development servers

```bash
bun run dev          # starts backend (port 3000) + frontend (port 5173) concurrently
```

Or start them individually:

```bash
bun run dev:backend   # Hono API on http://localhost:3000
bun run dev:frontend  # Vite dev server on http://localhost:5173
```

The Vite dev server proxies `/api/*` to the backend, so the frontend always calls the same origin.

---

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start both servers |
| `bun run dev:backend` | Backend only |
| `bun run dev:frontend` | Frontend only |
| `bun run typecheck` | TypeScript check across both workspaces |
| `bun run test` | Unit + integration tests (Bun + Vitest) |
| `bun run e2e` | Playwright end-to-end tests |
| `bun run e2e:install` | Install Playwright Chromium browser |
| `bun run --cwd backend db:generate` | Generate a Drizzle migration from schema changes |
| `bun run --cwd backend db:migrate` | Apply pending migrations |
| `bun run --cwd backend db:studio` | Open Drizzle Studio (visual DB browser) |

---

## Architecture

### End-to-end type safety via Hono RPC

The backend exports a single `AppType` from `backend/src/index.ts`:

```typescript
export type AppType = typeof routes
```

The frontend's `client.ts` wraps it with Hono's typed client:

```typescript
import { hc } from 'hono/client'
import type { AppType } from 'backend'

export const client = hc<AppType>('/', { init: { credentials: 'include' } })
```

Every API call is fully typed — request bodies, query params, and response shapes are inferred directly from the route definitions. Changing a route's input or output type surfaces compile errors in the frontend immediately.

Response types in components are derived from the contract, never hand-written:

```typescript
export type Habit = InferResponseType<typeof client.api.habits.$get, 200>[number]
export type DashboardHabit = InferResponseType<typeof client.api.dashboard.$get>[number]
```

### Shared validation module

`backend/src/lib/validation.ts` is a pure-Zod module (no server dependencies) exposed via a `backend/validation` subpath export. Both the backend route validators and the frontend form schema import from this single source, so constraint drift between client and server is impossible:

```typescript
// frontend/src/lib/habit-schemas.ts
import { HEX_COLOR, HABIT_NAME_MAX, HABIT_EMOJI_MAX } from 'backend/validation'
```

### Auth boundary

Every `/api` route is gated by `requireAuth` middleware, which resolves the better-auth session from the request cookie and puts the user object on the Hono context (`c.get('user')`).

**Security invariant — userId scoping**: every habit and log query includes `AND user_id = :userId`. Ownership is verified server-side before any read or mutation. A client supplying someone else's habit ID gets a 404, not the data.

### Completion logging — idempotent toggle

One `habit_logs` row exists per `(habit_id, date)`, enforced by a `UNIQUE` constraint. Toggle-on inserts; toggle-off deletes. Future dates are rejected **server-side** (compared as `YYYY-MM-DD` strings, which sort lexicographically the same as by date). The insert uses `ON CONFLICT DO NOTHING` to handle races gracefully.

### Optimistic UI

Dashboard completion toggles apply immediately in the UI and roll back on error:

```typescript
onMutate: async ({ habitId }) => {
  await queryClient.cancelQueries({ queryKey: ['dashboard'] })
  const previous = queryClient.getQueryData(['dashboard'])
  queryClient.setQueryData(['dashboard'], (old) =>
    old.map(h => h.id === habitId ? { ...h, completedToday: !h.completedToday } : h)
  )
  return { previous }
},
onError: (_, __, ctx) => queryClient.setQueryData(['dashboard'], ctx?.previous),
onSettled: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
```

### Archive vs. delete

Archive sets `is_archived = true` — reversible, no data lost. Hard delete is only permitted when the habit has zero log entries (the server returns 409 otherwise). This prevents accidental loss of completion history.

### Streak computation

`computeStreaks(logDates)` in `backend/src/lib/streaks.ts` is called from the `/api/habits/:id/stats` endpoint. It walks backwards from today for the current streak and uses a sliding-window pass over ascending dates for the longest streak — O(n) with no external dependencies.

### Data flow

```
Browser
  │  form submit / toggle click
  ▼
TanStack Query mutation
  │  Hono RPC client (typed)
  ▼
Hono route handler
  │  requireAuth → userId guard
  ▼
Drizzle ORM
  │
  ▼
Neon Postgres
  │
  └─ response flows back up the same chain
     └─ TanStack Query cache updated (optimistic or settled)
```

---

## Key engineering considerations

**Server-side future-date rejection** — the toggle endpoint compares the supplied date against `new Date().toISOString().slice(0, 10)` and returns 400 for future dates. The UI guards this too, but the server check is the authoritative one.

**Standardised error envelope** — all errors return `{ error: string; code: ErrorCode; issues?: unknown }`. Machine-readable `ErrorCode` values let the frontend branch on error type without parsing message strings.

**Rate limiting on auth** — the `/api/auth/*` routes are rate-limited via `hono-rate-limiter` to mitigate brute-force attacks on the sign-in endpoint.

**Real-date validation** — the `YYYY-MM-DD` regex alone lets through impossible dates like `2026-02-30`. `isRealDate()` in `lib/validation.ts` performs a UTC round-trip check to catch them:

```typescript
const parsed = new Date(`${date}T00:00:00Z`)
return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date
```

**Accessibility** — interactive controls use semantic HTML (`<button>`, `<dialog>`, `<input>`), labels are associated via `htmlFor`/`id`, validation errors use `role="alert"` + `aria-invalid`, the completion toggle exposes `aria-pressed`, drag-reorder has keyboard support via dnd-kit's `KeyboardSensor`, and a skip link targets `#main-content`.

**Testing layers**

| Layer | Tool | What it covers |
|---|---|---|
| Unit | Bun test | `computeStreaks`, schema validation, error handling |
| Integration | Bun test + PGlite | Full HTTP round-trips against an in-memory Postgres |
| Component | Vitest + Testing Library | Optimistic toggle, rollback, query-client behaviour |
| End-to-end | Playwright | Full user journey: register → create habit → toggle → streak |
