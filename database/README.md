# TriangleBank Database

## Quick Setup (Recommended)

1. If you previously ran a failed migration, reset the public schema first (fresh project recommended):
   - Supabase Dashboard → Project Settings → or run on a new project
2. Run the **single combined file** in Supabase SQL Editor:

```
database/supabase/full_schema.sql
```

Copy the entire contents, paste into Supabase Dashboard → **SQL Editor** → **Run**.

### SQL fix note

The stock trading table is named `stock_orders` (not `orders`) to avoid reserved-word / parser conflicts that could cause errors like `syntax error at or near ";"`. Triggers use `EXECUTE PROCEDURE` for PostgreSQL compatibility.

## Individual Migrations

If you prefer incremental migrations, run files in `migrations/` folder in order (000 → 008).

## After Running SQL

1. Enable **Email** provider in Authentication → Providers
2. Set **Site URL** to your app URL (e.g. `http://localhost:3000`)
3. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://your-app.onrender.com/auth/callback`
4. Copy project URL and keys to `.env.local`

See main [README.md](../README.md) for full setup.
