-- =============================================================================
-- TriangleBank Phase 17 — Engagement (daily reward, leaderboard, news, prefs)
-- Run ONCE in Supabase SQL Editor. Do NOT re-run full_schema.sql.
-- =============================================================================

DO $$ BEGIN
  ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'daily_reward';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'daily_reward';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'market_news';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Daily rewards ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_reward_claims (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  claim_date    DATE NOT NULL,
  amount        NUMERIC(19, 4) NOT NULL CHECK (amount > 0),
  streak        INT NOT NULL DEFAULT 1 CHECK (streak >= 1),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT daily_reward_claims_user_date UNIQUE (user_id, claim_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_reward_user
  ON daily_reward_claims (user_id, claim_date DESC);

ALTER TABLE daily_reward_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_reward_select_own" ON daily_reward_claims;
CREATE POLICY "daily_reward_select_own" ON daily_reward_claims
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin());

-- ─── User preferences ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id                 UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  locale                  TEXT NOT NULL DEFAULT 'tr' CHECK (locale IN ('tr', 'en')),
  email_notifications     BOOLEAN NOT NULL DEFAULT true,
  transfer_notifications  BOOLEAN NOT NULL DEFAULT true,
  market_notifications    BOOLEAN NOT NULL DEFAULT true,
  showcase_vehicle_id     UUID REFERENCES game_items(id) ON DELETE SET NULL,
  showcase_property_id    UUID REFERENCES game_items(id) ON DELETE SET NULL,
  showcase_gadget_id      UUID REFERENCES game_items(id) ON DELETE SET NULL,
  showcase_collectible_id UUID REFERENCES game_items(id) ON DELETE SET NULL,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_prefs_select_own" ON user_preferences;
CREATE POLICY "user_prefs_select_own" ON user_preferences
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "user_prefs_insert_own" ON user_preferences;
CREATE POLICY "user_prefs_insert_own" ON user_preferences
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_prefs_update_own" ON user_preferences;
CREATE POLICY "user_prefs_update_own" ON user_preferences
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ─── Transfer quick contacts ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transfer_contacts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contact_user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transfer_count    INT NOT NULL DEFAULT 1 CHECK (transfer_count >= 1),
  last_transfer_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT transfer_contacts_unique UNIQUE (user_id, contact_user_id),
  CONSTRAINT transfer_contacts_not_self CHECK (user_id <> contact_user_id)
);

CREATE INDEX IF NOT EXISTS idx_transfer_contacts_user
  ON transfer_contacts (user_id, last_transfer_at DESC);

ALTER TABLE transfer_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transfer_contacts_select_own" ON transfer_contacts;
CREATE POLICY "transfer_contacts_select_own" ON transfer_contacts
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ─── Market news / events ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS market_news (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  title_en        TEXT NOT NULL,
  title_tr        TEXT NOT NULL,
  body_en         TEXT NOT NULL DEFAULT '',
  body_tr         TEXT NOT NULL DEFAULT '',
  sentiment       TEXT NOT NULL DEFAULT 'neutral'
                    CHECK (sentiment IN ('bullish', 'bearish', 'neutral')),
  impact_percent  NUMERIC(8, 4) NOT NULL DEFAULT 0,
  symbols         TEXT[] NOT NULL DEFAULT '{}',
  published_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  applied_at      TIMESTAMPTZ,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_market_news_active
  ON market_news (is_active, published_at DESC);

ALTER TABLE market_news ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "market_news_select_auth" ON market_news;
CREATE POLICY "market_news_select_auth" ON market_news
  FOR SELECT TO authenticated USING (is_active = true OR is_admin());

-- Economy defaults
INSERT INTO settings (key, value, description) VALUES
  ('daily_reward_base', '{"amount": 50, "currency": "USD"}', 'Base daily reward amount'),
  ('daily_reward_streak_bonus', '{"amount": 10, "currency": "USD", "max_streak": 7}', 'Extra per streak day'),
  ('shop_enabled', '{"enabled": true}', 'Enable/disable shop purchases'),
  ('marketplace_enabled', '{"enabled": true}', 'Enable/disable player marketplace')
ON CONFLICT (key) DO NOTHING;

-- Seed starter news (idempotent by slug)
INSERT INTO market_news (slug, title_en, title_tr, body_en, body_tr, sentiment, impact_percent, symbols, published_at)
VALUES
  (
    'tech-rally-open',
    'Tech names catch a bid',
    'Teknoloji hisselerinde yükseliş',
    'Simulated buying pressure hits mega-cap tech after overnight futures strength.',
    'Gece vadeli işlemlerindeki güç sonrası büyük teknoloji hisselerinde alım baskısı oluştu.',
    'bullish', 1.8, ARRAY['AAPL','MSFT','GOOGL','NVDA','META'], now() - interval '2 hours'
  ),
  (
    'ev-volatility',
    'EV names swing wildly',
    'Elektrikli araç hisselerinde dalgalanma',
    'Delivery rumors spark sharp moves in automotive names.',
    'Teslimat söylentileri otomotiv hisselerinde sert hareketlere yol açtı.',
    'bearish', -2.2, ARRAY['TSLA'], now() - interval '90 minutes'
  ),
  (
    'chip-supply-scare',
    'Chip supply scare fades',
    'Çip tedarik endişesi azalıyor',
    'Foundry chatter cools; semiconductor names stabilize.',
    'Dökümhanelerden gelen haberler sakinleşti; yarı iletken hisseleri dengelendi.',
    'bullish', 1.4, ARRAY['AMD','INTC','NVDA'], now() - interval '45 minutes'
  ),
  (
    'etf-rotation',
    'Quiet rotation into broad ETFs',
    'Geniş ETF''lere sakin rotasyon',
    'Risk appetite drifts toward index products.',
    'Risk iştahı endeks ürünlerine kayıyor.',
    'neutral', 0.6, ARRAY['SPY','QQQ'], now() - interval '20 minutes'
  ),
  (
    'stream-surge',
    'Streaming surprise lifts media',
    'Yayın sürprizi medyayı yükseltti',
    'Subscriber beat narrative lifts entertainment names.',
    'Abone sayısı beklentiyi aştı; eğlence hisseleri yükseldi.',
    'bullish', 2.0, ARRAY['NFLX','META'], now() - interval '10 minutes'
  )
ON CONFLICT (slug) DO NOTHING;

-- ─── Helpers ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION ensure_user_preferences()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN;
  END IF;
  INSERT INTO user_preferences (user_id)
  VALUES (v_uid)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION ensure_user_preferences() TO authenticated;

CREATE OR REPLACE FUNCTION get_daily_reward_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_today DATE := (now() AT TIME ZONE 'Europe/Istanbul')::DATE;
  v_yesterday DATE := v_today - 1;
  v_claimed BOOLEAN;
  v_streak INT := 0;
  v_base NUMERIC := 50;
  v_bonus NUMERIC := 10;
  v_max INT := 7;
  v_next_streak INT;
  v_amount NUMERIC;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT COALESCE((value->>'amount')::NUMERIC, 50) INTO v_base
  FROM settings WHERE key = 'daily_reward_base';

  SELECT
    COALESCE((value->>'amount')::NUMERIC, 10),
    COALESCE((value->>'max_streak')::INT, 7)
  INTO v_bonus, v_max
  FROM settings WHERE key = 'daily_reward_streak_bonus';

  SELECT EXISTS (
    SELECT 1 FROM daily_reward_claims
    WHERE user_id = v_uid AND claim_date = v_today
  ) INTO v_claimed;

  SELECT COALESCE(streak, 0) INTO v_streak
  FROM daily_reward_claims
  WHERE user_id = v_uid AND claim_date = v_yesterday;

  IF v_claimed THEN
    SELECT streak INTO v_streak
    FROM daily_reward_claims
    WHERE user_id = v_uid AND claim_date = v_today;
    v_next_streak := v_streak;
  ELSE
    v_next_streak := LEAST(COALESCE(v_streak, 0) + 1, v_max);
  END IF;

  v_amount := v_base + (v_next_streak - 1) * v_bonus;

  RETURN jsonb_build_object(
    'claimed_today', v_claimed,
    'streak', COALESCE(v_streak, 0),
    'next_streak', v_next_streak,
    'amount', v_amount,
    'base', v_base,
    'bonus', v_bonus,
    'max_streak', v_max,
    'claim_date', v_today
  );
END;
$$;

CREATE OR REPLACE FUNCTION claim_daily_reward()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_today DATE := (now() AT TIME ZONE 'Europe/Istanbul')::DATE;
  v_yesterday DATE := v_today - 1;
  v_prev_streak INT := 0;
  v_streak INT;
  v_base NUMERIC := 50;
  v_bonus NUMERIC := 10;
  v_max INT := 7;
  v_amount NUMERIC;
  v_account_id UUID;
  v_tx_id UUID;
  v_reference TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (
    SELECT 1 FROM profiles WHERE id = v_uid AND is_frozen = true
  ) THEN
    RAISE EXCEPTION 'Account is frozen';
  END IF;

  IF EXISTS (
    SELECT 1 FROM daily_reward_claims
    WHERE user_id = v_uid AND claim_date = v_today
  ) THEN
    RAISE EXCEPTION 'Already claimed today';
  END IF;

  SELECT COALESCE((value->>'amount')::NUMERIC, 50) INTO v_base
  FROM settings WHERE key = 'daily_reward_base';

  SELECT
    COALESCE((value->>'amount')::NUMERIC, 10),
    COALESCE((value->>'max_streak')::INT, 7)
  INTO v_bonus, v_max
  FROM settings WHERE key = 'daily_reward_streak_bonus';

  SELECT COALESCE(streak, 0) INTO v_prev_streak
  FROM daily_reward_claims
  WHERE user_id = v_uid AND claim_date = v_yesterday;

  v_streak := LEAST(COALESCE(v_prev_streak, 0) + 1, v_max);
  v_amount := v_base + (v_streak - 1) * v_bonus;

  SELECT id INTO v_account_id
  FROM bank_accounts
  WHERE user_id = v_uid AND status = 'active'
  LIMIT 1;

  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'No active account';
  END IF;

  v_reference := 'DAILY-' || to_char(v_today, 'YYYYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 8));

  INSERT INTO transactions (
    reference_id, type, status, amount, to_account_id,
    initiated_by, description, completed_at
  ) VALUES (
    v_reference, 'daily_reward', 'completed', v_amount,
    v_account_id, v_uid,
    format('Daily reward · day %s streak', v_streak),
    now()
  ) RETURNING id INTO v_tx_id;

  PERFORM apply_ledger_entry(v_tx_id, v_account_id, 'credit', v_amount);

  INSERT INTO daily_reward_claims (user_id, claim_date, amount, streak)
  VALUES (v_uid, v_today, v_amount, v_streak);

  INSERT INTO notifications (user_id, type, title, body, metadata)
  VALUES (
    v_uid, 'daily_reward', 'Daily reward claimed',
    format('You received $%s · streak day %s', trim(to_char(v_amount, '9999990.00')), v_streak),
    jsonb_build_object('amount', v_amount, 'streak', v_streak)
  );

  RETURN jsonb_build_object(
    'ok', true,
    'amount', v_amount,
    'streak', v_streak,
    'claim_date', v_today
  );
END;
$$;

CREATE OR REPLACE FUNCTION get_leaderboard(p_limit INT DEFAULT 50)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  username TEXT,
  triangle_id TEXT,
  cash NUMERIC,
  portfolio_value NUMERIC,
  inventory_value NUMERIC,
  net_worth NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  WITH latest_prices AS (
    SELECT DISTINCT ON (sp.symbol) sp.symbol, sp.price
    FROM stock_prices sp
    ORDER BY sp.symbol, sp.recorded_at DESC
  ),
  cash AS (
    SELECT ba.user_id, COALESCE(ba.balance, 0)::NUMERIC AS cash
    FROM bank_accounts ba
    WHERE ba.status = 'active'
  ),
  port AS (
    SELECT p.user_id,
      COALESCE(SUM(p.quantity * lp.price), 0)::NUMERIC AS portfolio_value
    FROM portfolios p
    LEFT JOIN latest_prices lp ON lp.symbol = p.symbol
    WHERE p.quantity > 0
    GROUP BY p.user_id
  ),
  inv AS (
    SELECT ui.user_id,
      COALESCE(SUM(ui.quantity * gi.shop_price * 0.55), 0)::NUMERIC AS inventory_value
    FROM user_inventory ui
    JOIN game_items gi ON gi.id = ui.item_id
    GROUP BY ui.user_id
  ),
  ranked AS (
    SELECT
      pr.id AS user_id,
      pr.username,
      pr.triangle_id,
      COALESCE(c.cash, 0) AS cash,
      COALESCE(po.portfolio_value, 0) AS portfolio_value,
      COALESCE(i.inventory_value, 0) AS inventory_value,
      (COALESCE(c.cash, 0) + COALESCE(po.portfolio_value, 0) + COALESCE(i.inventory_value, 0)) AS net_worth
    FROM profiles pr
    LEFT JOIN cash c ON c.user_id = pr.id
    LEFT JOIN port po ON po.user_id = pr.id
    LEFT JOIN inv i ON i.user_id = pr.id
    WHERE pr.is_frozen = false
  )
  SELECT
    ROW_NUMBER() OVER (ORDER BY r.net_worth DESC, r.username ASC) AS rank,
    r.user_id,
    r.username,
    r.triangle_id,
    ROUND(r.cash, 2),
    ROUND(r.portfolio_value, 2),
    ROUND(r.inventory_value, 2),
    ROUND(r.net_worth, 2)
  FROM ranked r
  ORDER BY r.net_worth DESC, r.username ASC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 100));
END;
$$;

CREATE OR REPLACE FUNCTION apply_market_news(p_news_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_sym TEXT;
  v_last NUMERIC;
  v_new NUMERIC;
  v_change NUMERIC;
  v_pct NUMERIC;
  v_count INT := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  FOR r IN
    SELECT *
    FROM market_news
    WHERE is_active = true
      AND applied_at IS NULL
      AND (p_news_id IS NULL OR id = p_news_id)
      AND (expires_at IS NULL OR expires_at > now())
    ORDER BY published_at ASC
    LIMIT 5
  LOOP
    FOREACH v_sym IN ARRAY COALESCE(r.symbols, ARRAY[]::TEXT[])
    LOOP
      SELECT price INTO v_last
      FROM stock_prices
      WHERE symbol = v_sym
      ORDER BY recorded_at DESC
      LIMIT 1;

      IF v_last IS NULL OR v_last <= 0 THEN
        CONTINUE;
      END IF;

      v_new := ROUND(v_last * (1 + (r.impact_percent / 100.0)), 4);
      IF v_new < 0.01 THEN v_new := 0.01; END IF;
      v_change := ROUND(v_new - v_last, 4);
      v_pct := ROUND((v_change / v_last) * 100, 4);

      INSERT INTO stock_prices (symbol, price, change_amount, change_percent, volume, recorded_at)
      VALUES (
        v_sym, v_new, v_change, v_pct,
        (800000 + floor(random() * 5000000))::BIGINT,
        now()
      );
      v_count := v_count + 1;
    END LOOP;

    UPDATE market_news SET applied_at = now() WHERE id = r.id;
  END LOOP;

  RETURN jsonb_build_object('applied_ticks', v_count);
END;
$$;

CREATE OR REPLACE FUNCTION upsert_transfer_contact(
  p_user_id UUID,
  p_contact_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL OR p_contact_user_id IS NULL OR p_user_id = p_contact_user_id THEN
    RETURN;
  END IF;

  INSERT INTO transfer_contacts (user_id, contact_user_id, transfer_count, last_transfer_at)
  VALUES (p_user_id, p_contact_user_id, 1, now())
  ON CONFLICT (user_id, contact_user_id) DO UPDATE SET
    transfer_count = transfer_contacts.transfer_count + 1,
    last_transfer_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION equip_showcase_item(
  p_slot TEXT,
  p_item_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_cat TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_slot NOT IN ('vehicle', 'property', 'gadget', 'collectible') THEN
    RAISE EXCEPTION 'Invalid showcase slot';
  END IF;

  PERFORM ensure_user_preferences();

  IF p_item_id IS NOT NULL THEN
    SELECT gi.category INTO v_cat
    FROM user_inventory ui
    JOIN game_items gi ON gi.id = ui.item_id
    WHERE ui.user_id = v_uid AND ui.item_id = p_item_id
    LIMIT 1;

    IF v_cat IS NULL THEN
      RAISE EXCEPTION 'Item not in inventory';
    END IF;

    IF v_cat <> p_slot AND NOT (p_slot = 'collectible' AND v_cat IN ('collectible', 'lifestyle')) THEN
      RAISE EXCEPTION 'Item category does not match slot';
    END IF;
  END IF;

  IF p_slot = 'vehicle' THEN
    UPDATE user_preferences SET showcase_vehicle_id = p_item_id, updated_at = now() WHERE user_id = v_uid;
  ELSIF p_slot = 'property' THEN
    UPDATE user_preferences SET showcase_property_id = p_item_id, updated_at = now() WHERE user_id = v_uid;
  ELSIF p_slot = 'gadget' THEN
    UPDATE user_preferences SET showcase_gadget_id = p_item_id, updated_at = now() WHERE user_id = v_uid;
  ELSE
    UPDATE user_preferences SET showcase_collectible_id = p_item_id, updated_at = now() WHERE user_id = v_uid;
  END IF;

  RETURN jsonb_build_object('ok', true, 'slot', p_slot, 'item_id', p_item_id);
END;
$$;

CREATE OR REPLACE FUNCTION update_user_preferences(
  p_locale TEXT DEFAULT NULL,
  p_email_notifications BOOLEAN DEFAULT NULL,
  p_transfer_notifications BOOLEAN DEFAULT NULL,
  p_market_notifications BOOLEAN DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  PERFORM ensure_user_preferences();

  UPDATE user_preferences SET
    locale = COALESCE(p_locale, locale),
    email_notifications = COALESCE(p_email_notifications, email_notifications),
    transfer_notifications = COALESCE(p_transfer_notifications, transfer_notifications),
    market_notifications = COALESCE(p_market_notifications, market_notifications),
    updated_at = now()
  WHERE user_id = v_uid
    AND (p_locale IS NULL OR p_locale IN ('tr', 'en'));

  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION admin_upsert_market_news(
  p_slug TEXT,
  p_title_en TEXT,
  p_title_tr TEXT,
  p_body_en TEXT,
  p_body_tr TEXT,
  p_sentiment TEXT,
  p_impact_percent NUMERIC,
  p_symbols TEXT[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_id UUID;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  INSERT INTO market_news (
    slug, title_en, title_tr, body_en, body_tr,
    sentiment, impact_percent, symbols, created_by, published_at
  ) VALUES (
    p_slug, p_title_en, p_title_tr, COALESCE(p_body_en, ''), COALESCE(p_body_tr, ''),
    COALESCE(p_sentiment, 'neutral'), COALESCE(p_impact_percent, 0),
    COALESCE(p_symbols, ARRAY[]::TEXT[]), v_uid, now()
  )
  ON CONFLICT (slug) DO UPDATE SET
    title_en = EXCLUDED.title_en,
    title_tr = EXCLUDED.title_tr,
    body_en = EXCLUDED.body_en,
    body_tr = EXCLUDED.body_tr,
    sentiment = EXCLUDED.sentiment,
    impact_percent = EXCLUDED.impact_percent,
    symbols = EXCLUDED.symbols,
    is_active = true,
    applied_at = NULL,
    published_at = now()
  RETURNING id INTO v_id;

  INSERT INTO admin_logs (admin_id, action, details)
  VALUES (v_uid, 'market_news_upsert', jsonb_build_object('slug', p_slug, 'id', v_id));

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION admin_set_game_item_active(
  p_item_id UUID,
  p_is_active BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  UPDATE game_items SET is_active = p_is_active WHERE id = p_item_id;

  INSERT INTO admin_logs (admin_id, action, details)
  VALUES (
    v_uid, 'game_item_toggle',
    jsonb_build_object('item_id', p_item_id, 'is_active', p_is_active)
  );
END;
$$;

CREATE OR REPLACE FUNCTION admin_update_economy_setting(
  p_key TEXT,
  p_value JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  IF p_key NOT IN (
    'daily_reward_base',
    'daily_reward_streak_bonus',
    'shop_enabled',
    'marketplace_enabled',
    'stock_trading_enabled',
    'maintenance_mode',
    'transfer_daily_limit',
    'transfer_single_limit'
  ) THEN
    RAISE EXCEPTION 'Setting not allowed';
  END IF;

  INSERT INTO settings (key, value, updated_at, updated_by)
  VALUES (p_key, p_value, now(), v_uid)
  ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = now(),
    updated_by = v_uid;

  INSERT INTO admin_logs (admin_id, action, details)
  VALUES (v_uid, 'economy_setting', jsonb_build_object('key', p_key, 'value', p_value));
END;
$$;

GRANT EXECUTE ON FUNCTION get_daily_reward_status() TO authenticated;
GRANT EXECUTE ON FUNCTION claim_daily_reward() TO authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION apply_market_news(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION equip_showcase_item(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_preferences(TEXT, BOOLEAN, BOOLEAN, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_upsert_market_news(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_set_game_item_active(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_economy_setting(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_transfer_contact(UUID, UUID) TO authenticated;

DROP POLICY IF EXISTS "game_items_select_all" ON game_items;
CREATE POLICY "game_items_select_all" ON game_items
  FOR SELECT TO authenticated USING (is_active = true OR is_admin());
