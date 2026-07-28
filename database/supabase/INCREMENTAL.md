# SQL Incremental Changes

You already ran `full_schema.sql`. **Do not re-run it.**

## Phase 18 — Income + calmer global market (required for earn hub)

Run this **once** in Supabase SQL Editor:

```
database/supabase/incremental/phase-18-income-market.sql
```

Adds:
- Global quieter `tick_game_prices` + `spawn_market_news` (fresh headlines)
- Bank interest, property rent, side jobs, lucky spin, daily quests
- Cooldown / job tables

## Phase 17 — Engagement (required for new features)

Run this **once** in Supabase SQL Editor:

```
database/supabase/incremental/phase-17-engagement.sql
```

Adds:
- Daily reward claims + streak (Istanbul timezone)
- Leaderboard RPC (cash + portfolio + inventory)
- Market news / events that move simulated prices
- Transfer quick-contacts
- User preferences (locale, notifications, showcase slots)
- Richer admin economy RPCs (reward settings, news, shop item toggle)

## Phase 16 — Game Economy (required)

Run this **once** in Supabase SQL Editor:

```
database/supabase/incremental/phase-16-game-economy.sql
```

Adds:
- Welcome **$1000** for new signups (`handle_new_user`)
- Simulated market ticks (`tick_game_prices`) + seed prices
- Shop / inventory / player marketplace tables + RPCs
- Faster stock stale window (**30 seconds**)

Existing balances are not reset. Mint via admin if you want more cash on old accounts.

## Phase 8 — Stock Trading (if not already run)

```
database/supabase/incremental/phase-08-stock-trading.sql
```

Phase 16 redefines `buy_stock` / `sell_stock` with the 30s freshness rule.

## Env

Twelve Data is **no longer required**. Simulated prices only.

| Phase | SQL needed? | File |
|-------|-------------|------|
| 1–7   | No | — |
| 8     | Yes (once) | `incremental/phase-08-stock-trading.sql` |
| 9–15  | No new SQL | — |
| 16    | Yes (once) | `incremental/phase-16-game-economy.sql` |
| 17    | Yes (once) | `incremental/phase-17-engagement.sql` |
| 18    | Yes (once) | `incremental/phase-18-income-market.sql` |
