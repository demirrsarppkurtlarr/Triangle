-- =============================================================================
-- TriangleBank Phase 18 — Global 10s market, live news, income diversity
-- Run ONCE after phase-17. Do NOT re-run full_schema.sql.
-- =============================================================================

DO $$ BEGIN
  ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'interest';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'rent';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'job_pay';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'lottery';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'quest_reward';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'income';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS income_cooldowns (
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL,
  last_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  meta        JSONB NOT NULL DEFAULT '{}',
  PRIMARY KEY (user_id, kind)
);

ALTER TABLE income_cooldowns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "income_cooldowns_own" ON income_cooldowns;
CREATE POLICY "income_cooldowns_own" ON income_cooldowns
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin());

CREATE TABLE IF NOT EXISTS side_jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,
  title_en      TEXT NOT NULL,
  title_tr      TEXT NOT NULL,
  pay_min       NUMERIC(19, 4) NOT NULL,
  pay_max       NUMERIC(19, 4) NOT NULL,
  duration_sec  INT NOT NULL DEFAULT 120,
  icon          TEXT NOT NULL DEFAULT 'briefcase',
  is_active     BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE side_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "side_jobs_select" ON side_jobs;
CREATE POLICY "side_jobs_select" ON side_jobs
  FOR SELECT TO authenticated USING (is_active = true OR is_admin());

INSERT INTO side_jobs (slug, title_en, title_tr, pay_min, pay_max, duration_sec, icon) VALUES
  ('cafe-shift', 'Cafe shift', 'Kafe vardiyası', 35, 55, 90, 'coffee'),
  ('courier-run', 'Courier run', 'Kurye turu', 45, 80, 120, 'bike'),
  ('tutoring', 'Online tutoring', 'Online ders', 60, 110, 150, 'book'),
  ('design-gig', 'Logo gig', 'Logo işi', 70, 140, 180, 'palette'),
  ('night-guard', 'Night desk', 'Gece resepsiyon', 50, 95, 120, 'shield')
ON CONFLICT (slug) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  title_tr = EXCLUDED.title_tr,
  pay_min = EXCLUDED.pay_min,
  pay_max = EXCLUDED.pay_max,
  duration_sec = EXCLUDED.duration_sec,
  is_active = true;

CREATE TABLE IF NOT EXISTS active_jobs (
  user_id       UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  job_id        UUID NOT NULL REFERENCES side_jobs(id),
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completes_at  TIMESTAMPTZ NOT NULL,
  claimed       BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE active_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "active_jobs_own" ON active_jobs;
CREATE POLICY "active_jobs_own" ON active_jobs
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin());

-- ─── Spawn fresh market news (called with global ticks) ──────────────────────
CREATE OR REPLACE FUNCTION spawn_market_news()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_last TIMESTAMPTZ;
  v_pick INT;
  v_slug TEXT;
  v_title_en TEXT;
  v_title_tr TEXT;
  v_body_en TEXT;
  v_body_tr TEXT;
  v_sentiment TEXT;
  v_impact NUMERIC;
  v_symbols TEXT[];
  v_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT MAX(published_at) INTO v_last FROM market_news WHERE is_active = true;
  IF v_last IS NOT NULL AND v_last > now() - interval '45 seconds' THEN
    RETURN jsonb_build_object('spawned', false, 'reason', 'too_soon');
  END IF;

  v_pick := 1 + floor(random() * 8)::INT;

  CASE v_pick
    WHEN 1 THEN
      v_title_en := 'Mega-cap tech catches a bid';
      v_title_tr := 'Büyük teknoloji hisselerinde alım';
      v_body_en := 'Simulated inflows lift the largest names on the board.';
      v_body_tr := 'Simüle edilmiş para girişi en büyük hisseleri yükseltti.';
      v_sentiment := 'bullish'; v_impact := 1.2 + random() * 1.4;
      v_symbols := ARRAY['AAPL','MSFT','GOOGL','META','NVDA'];
    WHEN 2 THEN
      v_title_en := 'Chipmakers wobble on rumor mill';
      v_title_tr := 'Çip hisselerinde söylenti dalgası';
      v_body_en := 'Short-lived supply chatter hits semiconductor names.';
      v_body_tr := 'Kısa süreli tedarik söylentileri yarı iletkenleri vurdu.';
      v_sentiment := 'bearish'; v_impact := -(1.0 + random() * 1.8);
      v_symbols := ARRAY['AMD','INTC','NVDA'];
    WHEN 3 THEN
      v_title_en := 'EV names swing on delivery chatter';
      v_title_tr := 'EV hisselerinde teslimat konuşmaları';
      v_body_en := 'Automotive tape turns volatile after simulated headlines.';
      v_body_tr := 'Simüle manşetler sonrası otomotiv bandı dalgalı.';
      v_sentiment := CASE WHEN random() < 0.5 THEN 'bullish' ELSE 'bearish' END;
      v_impact := (CASE WHEN v_sentiment = 'bullish' THEN 1 ELSE -1 END) * (1.5 + random() * 2);
      v_symbols := ARRAY['TSLA'];
    WHEN 4 THEN
      v_title_en := 'Quiet bid for broad ETFs';
      v_title_tr := 'Geniş ETF''lere sakin talep';
      v_body_en := 'Risk appetite drifts into index products.';
      v_body_tr := 'Risk iştahı endeks ürünlerine kayıyor.';
      v_sentiment := 'neutral'; v_impact := 0.4 + random() * 0.8;
      v_symbols := ARRAY['SPY','QQQ'];
    WHEN 5 THEN
      v_title_en := 'Streaming beat narrative returns';
      v_title_tr := 'Yayın abone anlatısı geri döndü';
      v_body_en := 'Entertainment names bounce on simulated subscriber buzz.';
      v_body_tr := 'Simüle abone haberleriyle eğlence hisseleri toparlandı.';
      v_sentiment := 'bullish'; v_impact := 1.3 + random() * 1.6;
      v_symbols := ARRAY['NFLX','META','AMZN'];
    WHEN 6 THEN
      v_title_en := 'Retail caution trims consumer names';
      v_title_tr := 'Perakende temkinliliği tüketici hisselerini kesti';
      v_body_en := 'Simulated soft spending prints weigh on consumer tape.';
      v_body_tr := 'Simüle zayıf harcama verileri tüketici bandını baskıladı.';
      v_sentiment := 'bearish'; v_impact := -(0.8 + random() * 1.2);
      v_symbols := ARRAY['AMZN','AAPL'];
    WHEN 7 THEN
      v_title_en := 'Cloud spend optimism lifts software';
      v_title_tr := 'Bulut harcama iyimserliği yazılımı yükseltti';
      v_body_en := 'Enterprise IT budgets look firmer in the simulation.';
      v_body_tr := 'Simülasyonda kurumsal IT bütçeleri daha sağlam görünüyor.';
      v_sentiment := 'bullish'; v_impact := 0.9 + random() * 1.3;
      v_symbols := ARRAY['MSFT','GOOGL','AMZN'];
    ELSE
      v_title_en := 'Late-session volatility spike';
      v_title_tr := 'Seans sonu volatilite artışı';
      v_body_en := 'A random cross-section of names sees a late burst of activity.';
      v_body_tr := 'Rastgele bir hisse grubunda seans sonu hareketlilik.';
      v_sentiment := CASE WHEN random() < 0.5 THEN 'bullish' ELSE 'bearish' END;
      v_impact := (CASE WHEN v_sentiment = 'bullish' THEN 1 ELSE -1 END) * (0.7 + random() * 1.5);
      v_symbols := ARRAY['AAPL','TSLA','NVDA','SPY'];
  END CASE;

  v_slug := 'auto-' || to_char(now() AT TIME ZONE 'UTC', 'YYYYMMDDHH24MISS') || '-' ||
    substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 6);

  INSERT INTO market_news (
    slug, title_en, title_tr, body_en, body_tr,
    sentiment, impact_percent, symbols, published_at, applied_at, is_active
  ) VALUES (
    v_slug, v_title_en, v_title_tr, v_body_en, v_body_tr,
    v_sentiment, ROUND(v_impact::NUMERIC, 2), v_symbols, now(), NULL, true
  ) RETURNING id INTO v_id;

  -- Keep feed lean
  UPDATE market_news SET is_active = false
  WHERE id NOT IN (
    SELECT id FROM market_news ORDER BY published_at DESC LIMIT 40
  );

  RETURN jsonb_build_object('spawned', true, 'id', v_id, 'slug', v_slug);
END;
$$;

-- Soften tick_game_prices drift for calmer 10s cadence (same global path)
CREATE OR REPLACE FUNCTION tick_game_prices()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_last NUMERIC;
  v_seed NUMERIC;
  v_new NUMERIC;
  v_change NUMERIC;
  v_pct NUMERIC;
  v_vol BIGINT;
  v_count INT := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  FOR r IN
    SELECT s.symbol,
      CASE s.symbol
        WHEN 'AAPL' THEN 227.50
        WHEN 'AMD' THEN 480.32
        WHEN 'AMZN' THEN 185.60
        WHEN 'GOOGL' THEN 327.84
        WHEN 'INTC' THEN 88.99
        WHEN 'META' THEN 505.20
        WHEN 'MSFT' THEN 415.80
        WHEN 'NFLX' THEN 71.27
        WHEN 'NVDA' THEN 875.30
        WHEN 'QQQ' THEN 677.90
        WHEN 'SPY' THEN 737.00
        WHEN 'TSLA' THEN 248.90
        ELSE 100.00
      END AS seed
    FROM stock_symbols s
    WHERE s.is_active = true
  LOOP
    SELECT price INTO v_last
    FROM stock_prices
    WHERE symbol = r.symbol
    ORDER BY recorded_at DESC
    LIMIT 1;

    v_seed := COALESCE(NULLIF(v_last, 0), r.seed);
    -- Calmer moves for 10s global ticks (~±0.15%..±0.55%)
    v_new := ROUND(v_seed * (1 + ((random() - 0.5) * 0.011)), 4);
    IF v_new < 0.01 THEN v_new := 0.01; END IF;
    v_change := ROUND(v_new - v_seed, 4);
    v_pct := CASE WHEN v_seed > 0 THEN ROUND((v_change / v_seed) * 100, 4) ELSE 0 END;
    v_vol := (800000 + floor(random() * 5000000))::BIGINT;

    INSERT INTO stock_prices (symbol, price, change_amount, change_percent, volume, recorded_at)
    VALUES (r.symbol, v_new, v_change, v_pct, v_vol, now());
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('synced', v_count);
END;
$$;

CREATE OR REPLACE FUNCTION claim_bank_interest()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_account_id UUID;
  v_balance NUMERIC;
  v_amount NUMERIC;
  v_last TIMESTAMPTZ;
  v_tx_id UUID;
  v_ref TEXT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_uid AND is_frozen) THEN
    RAISE EXCEPTION 'Account is frozen';
  END IF;

  SELECT last_at INTO v_last FROM income_cooldowns
  WHERE user_id = v_uid AND kind = 'interest';
  IF v_last IS NOT NULL AND v_last > now() - interval '20 hours' THEN
    RAISE EXCEPTION 'Interest already claimed recently';
  END IF;

  SELECT id, balance INTO v_account_id, v_balance
  FROM bank_accounts WHERE user_id = v_uid AND status = 'active' LIMIT 1;
  IF v_account_id IS NULL THEN RAISE EXCEPTION 'No active account'; END IF;

  v_amount := ROUND(GREATEST(v_balance, 0) * 0.004, 2);
  IF v_amount < 1 THEN v_amount := 1; END IF;
  IF v_amount > 250 THEN v_amount := 250; END IF;

  v_ref := 'INT-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 10));
  INSERT INTO transactions (reference_id, type, status, amount, to_account_id, initiated_by, description, completed_at)
  VALUES (v_ref, 'interest', 'completed', v_amount, v_account_id, v_uid, 'Bank interest · 0.4% daily', now())
  RETURNING id INTO v_tx_id;
  PERFORM apply_ledger_entry(v_tx_id, v_account_id, 'credit', v_amount);

  INSERT INTO income_cooldowns (user_id, kind, last_at)
  VALUES (v_uid, 'interest', now())
  ON CONFLICT (user_id, kind) DO UPDATE SET last_at = now();

  INSERT INTO notifications (user_id, type, title, body, metadata)
  VALUES (v_uid, 'income', 'Interest received', format('+$%s bank interest', v_amount),
    jsonb_build_object('amount', v_amount));

  RETURN jsonb_build_object('ok', true, 'amount', v_amount);
END;
$$;

CREATE OR REPLACE FUNCTION claim_property_rent()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_item UUID;
  v_price NUMERIC;
  v_amount NUMERIC;
  v_last TIMESTAMPTZ;
  v_account_id UUID;
  v_tx_id UUID;
  v_ref TEXT;
  v_name TEXT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT last_at INTO v_last FROM income_cooldowns
  WHERE user_id = v_uid AND kind = 'rent';
  IF v_last IS NOT NULL AND v_last > now() - interval '20 hours' THEN
    RAISE EXCEPTION 'Rent already claimed recently';
  END IF;

  PERFORM ensure_user_preferences();
  SELECT showcase_property_id INTO v_item FROM user_preferences WHERE user_id = v_uid;
  IF v_item IS NULL THEN RAISE EXCEPTION 'Equip a property in your showcase first'; END IF;

  SELECT shop_price, name INTO v_price, v_name FROM game_items WHERE id = v_item;
  IF v_price IS NULL THEN RAISE EXCEPTION 'Property not found'; END IF;

  v_amount := ROUND(v_price * 0.025, 2);
  IF v_amount < 5 THEN v_amount := 5; END IF;

  SELECT id INTO v_account_id FROM bank_accounts WHERE user_id = v_uid AND status = 'active' LIMIT 1;
  v_ref := 'RENT-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 10));
  INSERT INTO transactions (reference_id, type, status, amount, to_account_id, initiated_by, description, completed_at)
  VALUES (v_ref, 'rent', 'completed', v_amount, v_account_id, v_uid, format('Property rent · %s', v_name), now())
  RETURNING id INTO v_tx_id;
  PERFORM apply_ledger_entry(v_tx_id, v_account_id, 'credit', v_amount);

  INSERT INTO income_cooldowns (user_id, kind, last_at)
  VALUES (v_uid, 'rent', now())
  ON CONFLICT (user_id, kind) DO UPDATE SET last_at = now();

  INSERT INTO notifications (user_id, type, title, body, metadata)
  VALUES (v_uid, 'income', 'Rent collected', format('+$%s from %s', v_amount, v_name),
    jsonb_build_object('amount', v_amount));

  RETURN jsonb_build_object('ok', true, 'amount', v_amount, 'property', v_name);
END;
$$;

CREATE OR REPLACE FUNCTION start_side_job(p_job_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_job RECORD;
  v_active RECORD;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_active FROM active_jobs WHERE user_id = v_uid AND claimed = false;
  IF FOUND AND v_active.completes_at > now() THEN
    RAISE EXCEPTION 'You already have an active job';
  END IF;
  IF FOUND AND v_active.completes_at <= now() AND v_active.claimed = false THEN
    RAISE EXCEPTION 'Claim your finished job first';
  END IF;

  SELECT * INTO v_job FROM side_jobs WHERE id = p_job_id AND is_active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Job not found'; END IF;

  INSERT INTO active_jobs (user_id, job_id, started_at, completes_at, claimed)
  VALUES (v_uid, v_job.id, now(), now() + make_interval(secs => v_job.duration_sec), false)
  ON CONFLICT (user_id) DO UPDATE SET
    job_id = EXCLUDED.job_id,
    started_at = EXCLUDED.started_at,
    completes_at = EXCLUDED.completes_at,
    claimed = false;

  RETURN jsonb_build_object('ok', true, 'completes_at', now() + make_interval(secs => v_job.duration_sec));
END;
$$;

CREATE OR REPLACE FUNCTION claim_side_job()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_active RECORD;
  v_job RECORD;
  v_pay NUMERIC;
  v_account_id UUID;
  v_tx_id UUID;
  v_ref TEXT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_active FROM active_jobs WHERE user_id = v_uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'No active job'; END IF;
  IF v_active.claimed THEN RAISE EXCEPTION 'Already claimed'; END IF;
  IF v_active.completes_at > now() THEN RAISE EXCEPTION 'Job still in progress'; END IF;

  SELECT * INTO v_job FROM side_jobs WHERE id = v_active.job_id;
  v_pay := ROUND(v_job.pay_min + random() * (v_job.pay_max - v_job.pay_min), 2);

  SELECT id INTO v_account_id FROM bank_accounts WHERE user_id = v_uid AND status = 'active' LIMIT 1;
  v_ref := 'JOB-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 10));
  INSERT INTO transactions (reference_id, type, status, amount, to_account_id, initiated_by, description, completed_at)
  VALUES (v_ref, 'job_pay', 'completed', v_pay, v_account_id, v_uid, format('Job pay · %s', v_job.title_en), now())
  RETURNING id INTO v_tx_id;
  PERFORM apply_ledger_entry(v_tx_id, v_account_id, 'credit', v_pay);

  UPDATE active_jobs SET claimed = true WHERE user_id = v_uid;

  INSERT INTO notifications (user_id, type, title, body, metadata)
  VALUES (v_uid, 'income', 'Job complete', format('+$%s · %s', v_pay, v_job.title_en),
    jsonb_build_object('amount', v_pay));

  RETURN jsonb_build_object('ok', true, 'amount', v_pay);
END;
$$;

CREATE OR REPLACE FUNCTION play_lucky_spin()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_cost NUMERIC := 25;
  v_win NUMERIC;
  v_roll NUMERIC;
  v_last TIMESTAMPTZ;
  v_account_id UUID;
  v_balance NUMERIC;
  v_tx_id UUID;
  v_ref TEXT;
  v_net NUMERIC;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT last_at INTO v_last FROM income_cooldowns
  WHERE user_id = v_uid AND kind = 'lottery';
  IF v_last IS NOT NULL AND v_last > now() - interval '3 minutes' THEN
    RAISE EXCEPTION 'Wait a few minutes between spins';
  END IF;

  SELECT id, balance INTO v_account_id, v_balance
  FROM bank_accounts WHERE user_id = v_uid AND status = 'active' LIMIT 1;
  IF v_balance < v_cost THEN RAISE EXCEPTION 'Need $25 for a spin'; END IF;

  v_roll := random();
  IF v_roll < 0.45 THEN v_win := 0;
  ELSIF v_roll < 0.75 THEN v_win := 20 + floor(random() * 30);
  ELSIF v_roll < 0.92 THEN v_win := 60 + floor(random() * 60);
  ELSE v_win := 150 + floor(random() * 100);
  END IF;

  v_ref := 'SPIN-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 10));
  INSERT INTO transactions (reference_id, type, status, amount, from_account_id, initiated_by, description, completed_at)
  VALUES (v_ref || 'C', 'lottery', 'completed', v_cost, v_account_id, v_uid, 'Lucky spin cost', now())
  RETURNING id INTO v_tx_id;
  PERFORM apply_ledger_entry(v_tx_id, v_account_id, 'debit', v_cost);

  IF v_win > 0 THEN
    INSERT INTO transactions (reference_id, type, status, amount, to_account_id, initiated_by, description, completed_at)
    VALUES (v_ref || 'W', 'lottery', 'completed', v_win, v_account_id, v_uid, 'Lucky spin win', now())
    RETURNING id INTO v_tx_id;
    PERFORM apply_ledger_entry(v_tx_id, v_account_id, 'credit', v_win);
  END IF;

  INSERT INTO income_cooldowns (user_id, kind, last_at)
  VALUES (v_uid, 'lottery', now())
  ON CONFLICT (user_id, kind) DO UPDATE SET last_at = now();

  v_net := v_win - v_cost;
  INSERT INTO notifications (user_id, type, title, body, metadata)
  VALUES (v_uid, 'income', 'Lucky spin',
    CASE WHEN v_win > 0 THEN format('Won $%s (net %s$%s)', v_win, CASE WHEN v_net >= 0 THEN '+' ELSE '' END, v_net)
         ELSE 'No win this spin' END,
    jsonb_build_object('win', v_win, 'cost', v_cost, 'net', v_net));

  RETURN jsonb_build_object('ok', true, 'cost', v_cost, 'win', v_win, 'net', v_net);
END;
$$;

CREATE OR REPLACE FUNCTION claim_quest_reward(p_quest TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_kind TEXT;
  v_last TIMESTAMPTZ;
  v_ok BOOLEAN := false;
  v_amount NUMERIC := 40;
  v_account_id UUID;
  v_tx_id UUID;
  v_ref TEXT;
  v_today DATE := (now() AT TIME ZONE 'Europe/Istanbul')::DATE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_quest NOT IN ('transfer', 'stock_buy', 'shop_buy') THEN
    RAISE EXCEPTION 'Unknown quest';
  END IF;

  v_kind := 'quest_' || p_quest;
  SELECT last_at INTO v_last FROM income_cooldowns WHERE user_id = v_uid AND kind = v_kind;
  IF v_last IS NOT NULL AND (v_last AT TIME ZONE 'Europe/Istanbul')::DATE = v_today THEN
    RAISE EXCEPTION 'Quest already claimed today';
  END IF;

  IF p_quest = 'transfer' THEN
    SELECT EXISTS (
      SELECT 1 FROM transactions t
      JOIN bank_accounts ba ON ba.id = t.from_account_id
      WHERE ba.user_id = v_uid AND t.type = 'transfer' AND t.status = 'completed'
        AND (t.completed_at AT TIME ZONE 'Europe/Istanbul')::DATE = v_today
    ) INTO v_ok;
    v_amount := 35;
  ELSIF p_quest = 'stock_buy' THEN
    SELECT EXISTS (
      SELECT 1 FROM trades tr
      WHERE tr.user_id = v_uid AND tr.side = 'buy'
        AND (tr.executed_at AT TIME ZONE 'Europe/Istanbul')::DATE = v_today
    ) INTO v_ok;
    v_amount := 45;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM transactions t
      JOIN bank_accounts ba ON ba.id = t.from_account_id
      WHERE ba.user_id = v_uid AND t.type = 'game_purchase' AND t.status = 'completed'
        AND (t.completed_at AT TIME ZONE 'Europe/Istanbul')::DATE = v_today
    ) INTO v_ok;
    v_amount := 40;
  END IF;

  IF NOT v_ok THEN RAISE EXCEPTION 'Complete the quest action first'; END IF;

  SELECT id INTO v_account_id FROM bank_accounts WHERE user_id = v_uid AND status = 'active' LIMIT 1;
  v_ref := 'QST-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 10));
  INSERT INTO transactions (reference_id, type, status, amount, to_account_id, initiated_by, description, completed_at)
  VALUES (v_ref, 'quest_reward', 'completed', v_amount, v_account_id, v_uid, format('Quest reward · %s', p_quest), now())
  RETURNING id INTO v_tx_id;
  PERFORM apply_ledger_entry(v_tx_id, v_account_id, 'credit', v_amount);

  INSERT INTO income_cooldowns (user_id, kind, last_at)
  VALUES (v_uid, v_kind, now())
  ON CONFLICT (user_id, kind) DO UPDATE SET last_at = now();

  INSERT INTO notifications (user_id, type, title, body, metadata)
  VALUES (v_uid, 'income', 'Quest complete', format('+$%s · %s', v_amount, p_quest),
    jsonb_build_object('amount', v_amount, 'quest', p_quest));

  RETURN jsonb_build_object('ok', true, 'amount', v_amount, 'quest', p_quest);
END;
$$;

GRANT EXECUTE ON FUNCTION spawn_market_news() TO authenticated;
GRANT EXECUTE ON FUNCTION claim_bank_interest() TO authenticated;
GRANT EXECUTE ON FUNCTION claim_property_rent() TO authenticated;
GRANT EXECUTE ON FUNCTION start_side_job(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION claim_side_job() TO authenticated;
GRANT EXECUTE ON FUNCTION play_lucky_spin() TO authenticated;
GRANT EXECUTE ON FUNCTION claim_quest_reward(TEXT) TO authenticated;
