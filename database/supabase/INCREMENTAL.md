# SQL Incremental Changes

You already ran `full_schema.sql`. **Do not re-run it.**

## Required for Phase 8 (Stock Market)

Run this **once** in Supabase SQL Editor:

```
database/supabase/incremental/phase-08-stock-trading.sql
```

Adds `buy_stock` and `sell_stock` RPCs (virtual trading against live Twelve Data prices stored in `stock_prices`).

## Env for live prices

```
TWELVE_DATA_API_KEY=your_key_from_twelvedata.com
```

Add the same key in Render Dashboard → Environment.

| Phase | SQL needed? | File |
|-------|-------------|------|
| 1–7   | No | — |
| 8     | Yes | `incremental/phase-08-stock-trading.sql` |
| 9+    | No new SQL yet | — |
