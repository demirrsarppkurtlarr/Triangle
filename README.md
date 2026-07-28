# TriangleBank

A production-quality **virtual banking simulation** platform built with Next.js, Supabase, and an Apple-inspired design system.

> **Important:** TriangleBank uses **virtual money only**. This is an educational simulation — never real financial transactions.

## Tech Stack

- **Framework:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- **UI:** shadcn/ui, Lucide Icons, Framer Motion
- **Data:** Supabase (Auth, PostgreSQL, RLS, Realtime, Storage)
- **Forms & Validation:** React Hook Form, Zod
- **State:** TanStack Query
- **Charts:** Chart.js, Recharts
- **Deployment:** Vercel, Render

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Supabase account

### Installation

```bash
git clone <repository-url>
cd triangle-bank
npm install
cp .env.example .env.local
```

### Game economy market

1. Run incremental SQL: `database/supabase/incremental/phase-16-game-economy.sql`
2. Run engagement SQL: `database/supabase/incremental/phase-17-engagement.sql`
3. Open `/stocks` — prices are **simulated** (fast random-walk ticks from seed values)
4. Shop (`/shop`), inventory, and player marketplace use the same game cash
5. Claim daily rewards at `/rewards` · leaderboard at `/leaderboard` · news at `/news`
6. New accounts start with **$1000**

Virtual money only — no live market API required.

### Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key to `.env.local`
3. Run migrations — see [database/README.md](database/README.md)
4. Enable Email auth in Supabase Dashboard → Authentication → Providers

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run typecheck` | TypeScript check |
| `npm test` | Run Vitest unit/component tests |
| `npm run test:watch` | Vitest watch mode |

## Deploy to Render

TriangleBank includes a [`render.yaml`](render.yaml) Blueprint for one-click deployment.

1. Push the repo to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**
3. Connect your repository
4. Set environment variables:
   - `NEXT_PUBLIC_APP_URL` — your Render URL (e.g. `https://triangle-bank.onrender.com`)
   - `NEXT_PUBLIC_SUPABASE_URL` — from Supabase project settings
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase project settings
   - `SUPABASE_SERVICE_ROLE_KEY` — from Supabase (server-only, never expose to client)
5. Deploy

Health check endpoint: `/api/health`

## Project Structure

```
src/
├── app/              # Next.js App Router pages & layouts
├── components/       # Shared UI components (ui/, brand/, layout/)
├── features/         # Feature modules (auth, transfers, stocks, etc.)
├── hooks/            # Custom React hooks
├── lib/              # Core libraries (supabase, query, utils)
├── server/           # Server-only utilities
├── services/         # Business logic services
├── actions/          # Server actions
├── types/            # Shared TypeScript types
├── schemas/          # Zod validation schemas
└── utils/            # Constants & helpers

database/
└── supabase/
    └── migrations/   # SQL migrations (9 files)

supabase/             # Supabase local config
render.yaml           # Render Blueprint
```

## Development Phases

| Phase | Status | Description |
|-------|--------|-------------|
| 1 | ✅ Complete | Project architecture & configuration |
| 2 | ✅ Complete | Supabase database setup |
| 3 | ✅ Complete | Authentication |
| 4 | ✅ Complete | Triangle IDs |
| 5 | ✅ Complete | Dashboard |
| 6 | ✅ Complete | Transfer system |
| 7 | ✅ Complete | Admin panel |
| 8 | ✅ Complete | Simulated stock market |
| 9 | ✅ Complete | Portfolio |
| 10 | ✅ Complete | Realtime |
| 11 | ✅ Complete | Notifications |
| 12 | ✅ Complete | Mobile optimization |
| 13 | ✅ Complete | Animations |
| 14 | ✅ Complete | Testing |
| 15 | ✅ Complete | Deployment |
| 16 | ✅ Complete | Game economy (shop, inventory, marketplace) |
| 17 | ✅ Complete | Engagement (daily reward, i18n, leaderboard, news, contacts, showcase, settings, admin economy) |
| 18 | ✅ Complete | Global 10s market, live news spawn, earn hub (interest/rent/jobs/spin/quests), admin crash fix |

## Environment Variables

See [`.env.example`](.env.example) for required variables.

## License

Private — educational simulation project.
