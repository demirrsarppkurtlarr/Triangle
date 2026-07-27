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

### Stock market (Twelve Data)

1. Create an API key at [twelvedata.com](https://twelvedata.com/)
2. Add `TWELVE_DATA_API_KEY` to `.env.local` and Render env vars
3. Run incremental SQL: `database/supabase/incremental/phase-08-stock-trading.sql`
4. Open `/stocks` → Refresh prices → trade with virtual balance

Virtual money only — prices track the real market for simulation.

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
| 8 | ✅ Complete | Stock market (Twelve Data) |
| 9 | ✅ Complete | Portfolio |
| 10 | ✅ Complete | Realtime |
| 11 | ✅ Complete | Notifications |
| 12 | Pending | Mobile optimization |
| 13 | Pending | Animations |
| 14 | Pending | Testing |
| 15 | Pending | Deployment |

## Environment Variables

See [`.env.example`](.env.example) for required variables.

## License

Private — educational simulation project.
