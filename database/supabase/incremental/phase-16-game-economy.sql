-- =============================================================================
-- TriangleBank Phase 16 — Game Economy
-- Run ONCE in Supabase SQL Editor. Do NOT re-run full_schema.sql.
-- =============================================================================

DO $$ BEGIN
  ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'game_purchase';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'game_sale';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'item_trade';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'game_item';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS game_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  category      TEXT NOT NULL CHECK (category IN (
    'vehicle', 'property', 'gadget', 'collectible', 'lifestyle'
  )),
  rarity        TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN (
    'common', 'uncommon', 'rare', 'epic', 'legendary'
  )),
  shop_price    NUMERIC(19, 4) NOT NULL CHECK (shop_price > 0),
  sell_back_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.55
    CHECK (sell_back_rate > 0 AND sell_back_rate <= 1),
  icon          TEXT NOT NULL DEFAULT 'package',
  sort_order    INT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_items_category ON game_items (category) WHERE is_active;

CREATE TABLE IF NOT EXISTS user_inventory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id         UUID NOT NULL REFERENCES game_items(id),
  quantity        INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  purchase_price  NUMERIC(19, 4) NOT NULL DEFAULT 0,
  acquired_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_inventory_user_item_unique UNIQUE (user_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_user_inventory_user ON user_inventory (user_id);

CREATE TABLE IF NOT EXISTS item_listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id         UUID NOT NULL REFERENCES game_items(id),
  quantity        INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price           NUMERIC(19, 4) NOT NULL CHECK (price > 0),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active', 'sold', 'cancelled'
  )),
  buyer_id        UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  sold_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_item_listings_active ON item_listings (status, created_at DESC)
  WHERE status = 'active';

ALTER TABLE game_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "game_items_select_all" ON game_items;
CREATE POLICY "game_items_select_all" ON game_items
  FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "user_inventory_select_own" ON user_inventory;
CREATE POLICY "user_inventory_select_own" ON user_inventory
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "item_listings_select_all" ON item_listings;
CREATE POLICY "item_listings_select_all" ON item_listings
  FOR SELECT TO authenticated USING (true);

INSERT INTO game_items (slug, name, description, category, rarity, shop_price, sell_back_rate, icon, sort_order)
VALUES
  ('used-scooter', 'Used Scooter', 'Gets you across town. Barely.', 'vehicle', 'common', 120, 0.50, 'bike', 10),
  ('city-bike', 'City Bike', 'Pedal power for daily quests.', 'vehicle', 'common', 180, 0.55, 'bike', 20),
  ('hatchback', 'Compact Hatchback', 'Your first real car.', 'vehicle', 'uncommon', 450, 0.55, 'car', 30),
  ('sedan', 'City Sedan', 'Comfortable daily driver.', 'vehicle', 'uncommon', 650, 0.55, 'car', 40),
  ('suv', 'Family SUV', 'Space for loot and friends.', 'vehicle', 'rare', 850, 0.50, 'car', 50),
  ('sports-coupe', 'Sports Coupe', 'Looks fast standing still.', 'vehicle', 'rare', 920, 0.50, 'car', 60),
  ('motorcycle', 'Street Motorcycle', 'Two wheels, zero patience.', 'vehicle', 'uncommon', 520, 0.55, 'bike', 70),
  ('yacht-tender', 'Yacht Tender', 'Tiny boat, big dreams.', 'vehicle', 'epic', 980, 0.45, 'ship', 80),
  ('jet-ski', 'Jet Ski', 'Weekend boss energy.', 'vehicle', 'epic', 1100, 0.45, 'waves', 90),
  ('studio-loft', 'Studio Loft', 'One room, infinite grind.', 'property', 'common', 300, 0.60, 'home', 100),
  ('downtown-apt', 'Downtown Apartment', 'City lights included.', 'property', 'uncommon', 550, 0.55, 'home', 110),
  ('suburban-house', 'Suburban House', 'Lawn optional, pride included.', 'property', 'rare', 800, 0.55, 'home', 120),
  ('beach-condo', 'Beach Condo', 'Wake up to simulated waves.', 'property', 'rare', 900, 0.50, 'home', 130),
  ('rooftop-garden', 'Rooftop Garden', 'Grow greens, stack green.', 'property', 'rare', 620, 0.55, 'flower', 135),
  ('penthouse', 'Skyline Penthouse', 'View costs extra. Worth it.', 'property', 'epic', 1200, 0.45, 'building', 140),
  ('cabin', 'Mountain Cabin', 'Offline vibes, online money.', 'property', 'uncommon', 480, 0.55, 'home', 150),
  ('parking-spot', 'Premium Parking Spot', 'Rarest flex in the city.', 'property', 'legendary', 1500, 0.40, 'parking', 160),
  ('budget-phone', 'Budget Phone', 'Calls, texts, vibes.', 'gadget', 'common', 80, 0.50, 'smartphone', 200),
  ('flagship-phone', 'Flagship Phone', 'Camera eats credits.', 'gadget', 'uncommon', 220, 0.55, 'smartphone', 210),
  ('laptop-pro', 'Pro Laptop', 'Ship features faster.', 'gadget', 'rare', 400, 0.55, 'laptop', 220),
  ('gaming-rig', 'Gaming Rig', 'FPS and portfolio charts.', 'gadget', 'rare', 560, 0.50, 'monitor', 230),
  ('smartwatch', 'Smart Watch', 'Tap to flex heart rate.', 'gadget', 'common', 140, 0.55, 'watch', 240),
  ('drone', 'City Drone', 'Aerial screenshots of wealth.', 'gadget', 'uncommon', 260, 0.50, 'plane', 250),
  ('vr-headset', 'VR Headset', 'Trade stocks in another world.', 'gadget', 'uncommon', 300, 0.50, 'glasses', 260),
  ('noise-cans', 'Noise Cancelling Cans', 'Ignore the market noise.', 'gadget', 'common', 110, 0.55, 'headphones', 270),
  ('mech-keyboard', 'Mech Keyboard', 'Clack your way to riches.', 'gadget', 'common', 100, 0.55, 'keyboard', 275),
  ('gold-watch', 'Gold Watch', 'Time is money. Literally.', 'collectible', 'rare', 420, 0.60, 'watch', 300),
  ('art-print', 'Limited Art Print', 'Wall flex for the loft.', 'collectible', 'uncommon', 160, 0.55, 'frame', 310),
  ('trading-card', 'Rare Trading Card', 'Holo shine, holo gains.', 'collectible', 'rare', 95, 0.65, 'sparkles', 320),
  ('vintage-camera', 'Vintage Camera', 'Shoot the moonshots.', 'collectible', 'uncommon', 210, 0.55, 'camera', 330),
  ('signed-jersey', 'Signed Jersey', 'Goat energy.', 'collectible', 'epic', 700, 0.50, 'shirt', 340),
  ('nft-poster', 'NFT Poster (Joke)', 'Yes, it is ironic.', 'collectible', 'common', 50, 0.40, 'image', 350),
  ('trophy', 'Champion Trophy', 'You beat the simulation.', 'collectible', 'legendary', 2000, 0.35, 'trophy', 360),
  ('coffee-kit', 'Barista Kit', 'Fuel for all-nighters.', 'lifestyle', 'common', 70, 0.55, 'coffee', 400),
  ('gym-pass', 'Elite Gym Pass', 'Gains before gains.', 'lifestyle', 'common', 90, 0.40, 'dumbbell', 410),
  ('chef-set', 'Chef Knife Set', 'Slice fees, not fingers.', 'lifestyle', 'uncommon', 150, 0.55, 'utensils', 420),
  ('designer-bag', 'Designer Bag', 'Capacity: one ego.', 'lifestyle', 'rare', 380, 0.50, 'shopping-bag', 430),
  ('spa-day', 'Spa Day Voucher', 'Reset after a red candle.', 'lifestyle', 'uncommon', 130, 0.30, 'sparkles', 440),
  ('concert-ticket', 'Front Row Ticket', 'Vibes over charts.', 'lifestyle', 'uncommon', 200, 0.25, 'ticket', 450),
  ('wine-cellar', 'Starter Wine Cellar', 'Ages better than bags.', 'lifestyle', 'rare', 480, 0.55, 'wine', 460)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  shop_price = EXCLUDED.shop_price,
  sell_back_rate = EXCLUDED.sell_back_rate,
  rarity = EXCLUDED.rarity,
  is_active = true;

INSERT INTO stock_symbols (symbol, name, sector, exchange, is_active) VALUES
  ('AAPL', 'Apple Inc.', 'Technology', 'NASDAQ', true),
  ('AMD', 'Advanced Micro Devices', 'Technology', 'NASDAQ', true),
  ('AMZN', 'Amazon.com Inc.', 'Consumer', 'NASDAQ', true),
  ('GOOGL', 'Alphabet Inc.', 'Technology', 'NASDAQ', true),
  ('INTC', 'Intel Corporation', 'Technology', 'NASDAQ', true),
  ('META', 'Meta Platforms Inc.', 'Technology', 'NASDAQ', true),
  ('MSFT', 'Microsoft Corporation', 'Technology', 'NASDAQ', true),
  ('NFLX', 'Netflix Inc.', 'Communication', 'NASDAQ', true),
  ('NVDA', 'NVIDIA Corporation', 'Technology', 'NASDAQ', true),
  ('QQQ', 'Invesco QQQ Trust', 'ETF', 'NASDAQ', true),
  ('SPY', 'SPDR S&P 500 ETF', 'ETF', 'NYSE', true),
  ('TSLA', 'Tesla Inc.', 'Automotive', 'NASDAQ', true)
ON CONFLICT (symbol) DO UPDATE SET name = EXCLUDED.name, is_active = true;

INSERT INTO stock_prices (symbol, price, change_amount, change_percent, volume, recorded_at)
VALUES
  ('AAPL', 227.50, 1.24, 0.55, 45000000, now()),
  ('AMD', 480.32, -41.62, -7.98, 2062236, now()),
  ('AMZN', 185.60, 0.80, 0.43, 31000000, now()),
  ('GOOGL', 327.84, 8.09, 2.53, 2516652, now()),
  ('INTC', 88.99, -3.33, -3.61, 8793096, now()),
  ('META', 505.20, 3.16, 0.63, 15000000, now()),
  ('MSFT', 415.80, 2.11, 0.51, 22000000, now()),
  ('NFLX', 71.27, 1.18, 1.68, 3160108, now()),
  ('NVDA', 875.30, -5.40, -0.61, 38000000, now()),
  ('QQQ', 677.90, -6.36, -0.93, 1479556, now()),
  ('SPY', 737.00, -1.92, -0.26, 2577084, now()),
  ('TSLA', 248.90, -2.31, -0.92, 52000000, now());

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username TEXT;
  v_is_admin BOOLEAN;
  v_account_id UUID;
  v_tx_id UUID;
  v_reference TEXT;
  v_welcome NUMERIC := 1000;
BEGIN
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  v_is_admin := (lower(v_username) = 'demirsarpk');

  INSERT INTO profiles (id, triangle_id, username, email, full_name, is_admin)
  VALUES (
    NEW.id,
    generate_triangle_id(),
    v_username,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    v_is_admin
  );

  INSERT INTO bank_accounts (user_id, account_number)
  VALUES (NEW.id, generate_account_number())
  RETURNING id INTO v_account_id;

  v_reference := 'WELCOME-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 12));

  INSERT INTO transactions (
    reference_id, type, status, amount, to_account_id,
    initiated_by, description, completed_at
  ) VALUES (
    v_reference, 'deposit', 'completed', v_welcome,
    v_account_id, NEW.id, 'Game start cash · $1000', now()
  ) RETURNING id INTO v_tx_id;

  PERFORM apply_ledger_entry(v_tx_id, v_account_id, 'credit', v_welcome);

  INSERT INTO notifications (user_id, type, title, body, metadata)
  VALUES (
    NEW.id, 'system', 'Welcome to TriangleBank',
    'You received $1000 game cash. Trade stocks, buy cars & homes, flex on the marketplace.',
    jsonb_build_object('amount', v_welcome)
  );

  RETURN NEW;
END;
$$;

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
      END AS seed_price
    FROM stock_symbols s
    WHERE s.is_active = true
  LOOP
    SELECT price INTO v_last
    FROM stock_prices
    WHERE symbol = r.symbol
    ORDER BY recorded_at DESC
    LIMIT 1;

    v_seed := r.seed_price;
    v_last := COALESCE(v_last, v_seed);
    v_new := v_last * (1 + ((random() * 0.05) - 0.025));
    v_new := v_new + (v_seed - v_new) * 0.08;
    IF v_new < v_seed * 0.35 THEN v_new := v_seed * 0.35; END IF;
    IF v_new > v_seed * 2.5 THEN v_new := v_seed * 2.5; END IF;
    v_new := round(v_new, 2);
    v_change := round(v_new - v_last, 2);
    IF v_last > 0 THEN v_pct := round((v_change / v_last) * 100, 2); ELSE v_pct := 0; END IF;
    v_vol := (500000 + floor(random() * 60000000))::BIGINT;

    INSERT INTO stock_prices (symbol, price, change_amount, change_percent, volume, recorded_at)
    VALUES (r.symbol, v_new, v_change, v_pct, v_vol, now());
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'synced', v_count, 'at', now());
END;
$$;

GRANT EXECUTE ON FUNCTION tick_game_prices TO authenticated;

-- =============================================================================
-- Updated stock trading RPCs (30-second stale-price window)
-- =============================================================================

-- Buy virtual shares at the latest recorded stock_prices.price
CREATE OR REPLACE FUNCTION buy_stock(
  p_symbol TEXT,
  p_quantity NUMERIC,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_account_id UUID;
  v_price NUMERIC;
  v_total NUMERIC;
  v_frozen BOOLEAN;
  v_trading_enabled BOOLEAN;
  v_existing UUID;
  v_order_id UUID;
  v_tx_id UUID;
  v_reference TEXT;
  v_portfolio portfolios%ROWTYPE;
  v_new_qty NUMERIC;
  v_new_avg NUMERIC;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN RAISE EXCEPTION 'Quantity must be positive'; END IF;
  IF p_quantity != trunc(p_quantity, 4) THEN RAISE EXCEPTION 'Invalid quantity precision'; END IF;

  SELECT (value->>'enabled')::BOOLEAN INTO v_trading_enabled
  FROM settings WHERE key = 'stock_trading_enabled';
  IF COALESCE(v_trading_enabled, true) = false THEN
    RAISE EXCEPTION 'Stock trading is disabled';
  END IF;

  SELECT is_frozen INTO v_frozen FROM profiles WHERE id = v_user_id;
  IF v_frozen THEN RAISE EXCEPTION 'Your account is frozen'; END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing FROM stock_orders WHERE idempotency_key = p_idempotency_key;
    IF FOUND THEN
      RETURN jsonb_build_object('success', true, 'order_id', v_existing, 'duplicate', true);
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM stock_symbols WHERE symbol = p_symbol AND is_active = true) THEN
    RAISE EXCEPTION 'Symbol not available';
  END IF;

  SELECT price INTO v_price
  FROM stock_prices
  WHERE symbol = p_symbol
  ORDER BY recorded_at DESC
  LIMIT 1;

  IF v_price IS NULL OR v_price <= 0 THEN
    RAISE EXCEPTION 'No market price available for %', p_symbol;
  END IF;

  -- Reject stale prices older than 15 minutes (refresh required)
  IF NOT EXISTS (
    SELECT 1 FROM stock_prices
    WHERE symbol = p_symbol
      AND recorded_at >= now() - interval '30 seconds'
  ) THEN
    RAISE EXCEPTION 'Market price is stale. Refresh prices and try again.';
  END IF;

  v_total := round(v_price * p_quantity, 4);

  SELECT id INTO v_account_id
  FROM bank_accounts
  WHERE user_id = v_user_id AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Bank account not found'; END IF;

  INSERT INTO stock_orders (
    user_id, symbol, side, order_type, quantity, filled_quantity,
    status, idempotency_key, executed_at
  ) VALUES (
    v_user_id, p_symbol, 'buy', 'market', p_quantity, p_quantity,
    'filled', p_idempotency_key, now()
  ) RETURNING id INTO v_order_id;

  v_reference := 'BUY-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 16));

  INSERT INTO transactions (
    reference_id, type, status, amount, from_account_id,
    initiated_by, description, completed_at, metadata
  ) VALUES (
    v_reference, 'stock_buy', 'completed', v_total, v_account_id,
    v_user_id, 'Buy ' || p_quantity::TEXT || ' ' || p_symbol,
    now(),
    jsonb_build_object('symbol', p_symbol, 'quantity', p_quantity, 'price', v_price, 'order_id', v_order_id)
  ) RETURNING id INTO v_tx_id;

  PERFORM apply_ledger_entry(v_tx_id, v_account_id, 'debit', v_total);

  INSERT INTO trades (order_id, user_id, symbol, side, quantity, price, total)
  VALUES (v_order_id, v_user_id, p_symbol, 'buy', p_quantity, v_price, v_total);

  SELECT * INTO v_portfolio FROM portfolios WHERE user_id = v_user_id AND symbol = p_symbol FOR UPDATE;

  IF FOUND THEN
    v_new_qty := v_portfolio.quantity + p_quantity;
    v_new_avg := CASE
      WHEN v_new_qty = 0 THEN 0
      ELSE round(((v_portfolio.quantity * v_portfolio.average_cost) + v_total) / v_new_qty, 4)
    END;
    UPDATE portfolios
    SET quantity = v_new_qty, average_cost = v_new_avg
    WHERE id = v_portfolio.id;
  ELSE
    INSERT INTO portfolios (user_id, symbol, quantity, average_cost)
    VALUES (v_user_id, p_symbol, p_quantity, v_price);
  END IF;

  INSERT INTO notifications (user_id, type, title, body, metadata)
  VALUES (
    v_user_id, 'stock_order_filled', 'Order filled',
    'Bought ' || p_quantity::TEXT || ' ' || p_symbol || ' @ $' || v_price::TEXT,
    jsonb_build_object('order_id', v_order_id, 'symbol', p_symbol)
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'transaction_id', v_tx_id,
    'reference_id', v_reference,
    'price', v_price,
    'total', v_total
  );
EXCEPTION WHEN OTHERS THEN
  IF v_order_id IS NOT NULL THEN
    UPDATE stock_orders SET status = 'rejected' WHERE id = v_order_id;
  END IF;
  RAISE;
END;
$$;

-- Sell virtual shares at the latest recorded stock_prices.price
CREATE OR REPLACE FUNCTION sell_stock(
  p_symbol TEXT,
  p_quantity NUMERIC,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_account_id UUID;
  v_price NUMERIC;
  v_total NUMERIC;
  v_frozen BOOLEAN;
  v_trading_enabled BOOLEAN;
  v_existing UUID;
  v_order_id UUID;
  v_tx_id UUID;
  v_reference TEXT;
  v_portfolio portfolios%ROWTYPE;
  v_new_qty NUMERIC;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN RAISE EXCEPTION 'Quantity must be positive'; END IF;

  SELECT (value->>'enabled')::BOOLEAN INTO v_trading_enabled
  FROM settings WHERE key = 'stock_trading_enabled';
  IF COALESCE(v_trading_enabled, true) = false THEN
    RAISE EXCEPTION 'Stock trading is disabled';
  END IF;

  SELECT is_frozen INTO v_frozen FROM profiles WHERE id = v_user_id;
  IF v_frozen THEN RAISE EXCEPTION 'Your account is frozen'; END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing FROM stock_orders WHERE idempotency_key = p_idempotency_key;
    IF FOUND THEN
      RETURN jsonb_build_object('success', true, 'order_id', v_existing, 'duplicate', true);
    END IF;
  END IF;

  SELECT price INTO v_price
  FROM stock_prices
  WHERE symbol = p_symbol
  ORDER BY recorded_at DESC
  LIMIT 1;

  IF v_price IS NULL OR v_price <= 0 THEN
    RAISE EXCEPTION 'No market price available for %', p_symbol;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM stock_prices
    WHERE symbol = p_symbol
      AND recorded_at >= now() - interval '30 seconds'
  ) THEN
    RAISE EXCEPTION 'Market price is stale. Refresh prices and try again.';
  END IF;

  SELECT * INTO v_portfolio
  FROM portfolios
  WHERE user_id = v_user_id AND symbol = p_symbol
  FOR UPDATE;

  IF NOT FOUND OR v_portfolio.quantity < p_quantity THEN
    RAISE EXCEPTION 'Insufficient shares';
  END IF;

  v_total := round(v_price * p_quantity, 4);

  SELECT id INTO v_account_id
  FROM bank_accounts
  WHERE user_id = v_user_id AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Bank account not found'; END IF;

  INSERT INTO stock_orders (
    user_id, symbol, side, order_type, quantity, filled_quantity,
    status, idempotency_key, executed_at
  ) VALUES (
    v_user_id, p_symbol, 'sell', 'market', p_quantity, p_quantity,
    'filled', p_idempotency_key, now()
  ) RETURNING id INTO v_order_id;

  v_reference := 'SELL-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 16));

  INSERT INTO transactions (
    reference_id, type, status, amount, to_account_id,
    initiated_by, description, completed_at, metadata
  ) VALUES (
    v_reference, 'stock_sell', 'completed', v_total, v_account_id,
    v_user_id, 'Sell ' || p_quantity::TEXT || ' ' || p_symbol,
    now(),
    jsonb_build_object('symbol', p_symbol, 'quantity', p_quantity, 'price', v_price, 'order_id', v_order_id)
  ) RETURNING id INTO v_tx_id;

  PERFORM apply_ledger_entry(v_tx_id, v_account_id, 'credit', v_total);

  INSERT INTO trades (order_id, user_id, symbol, side, quantity, price, total)
  VALUES (v_order_id, v_user_id, p_symbol, 'sell', p_quantity, v_price, v_total);

  v_new_qty := v_portfolio.quantity - p_quantity;
  IF v_new_qty = 0 THEN
    DELETE FROM portfolios WHERE id = v_portfolio.id;
  ELSE
    UPDATE portfolios SET quantity = v_new_qty WHERE id = v_portfolio.id;
  END IF;

  INSERT INTO notifications (user_id, type, title, body, metadata)
  VALUES (
    v_user_id, 'stock_order_filled', 'Order filled',
    'Sold ' || p_quantity::TEXT || ' ' || p_symbol || ' @ $' || v_price::TEXT,
    jsonb_build_object('order_id', v_order_id, 'symbol', p_symbol)
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'transaction_id', v_tx_id,
    'reference_id', v_reference,
    'price', v_price,
    'total', v_total
  );
EXCEPTION WHEN OTHERS THEN
  IF v_order_id IS NOT NULL THEN
    UPDATE stock_orders SET status = 'rejected' WHERE id = v_order_id;
  END IF;
  RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION buy_stock TO authenticated;
GRANT EXECUTE ON FUNCTION sell_stock TO authenticated;

-- Allow users to manage their own favorites (already in schema)
-- Allow SECURITY DEFINER portfolio writes via functions above only.


-- =============================================================================
-- Game shop and item marketplace RPCs
-- =============================================================================

CREATE OR REPLACE FUNCTION buy_game_item(
  p_item_id UUID,
  p_quantity INT DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_frozen BOOLEAN;
  v_item game_items%ROWTYPE;
  v_account_id UUID;
  v_total NUMERIC;
  v_tx_id UUID;
  v_reference TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN RAISE EXCEPTION 'Quantity must be positive'; END IF;

  SELECT is_frozen INTO v_frozen FROM profiles WHERE id = v_user_id;
  IF COALESCE(v_frozen, false) THEN RAISE EXCEPTION 'Your account is frozen'; END IF;

  SELECT * INTO v_item
  FROM game_items
  WHERE id = p_item_id AND is_active = true;

  IF NOT FOUND THEN RAISE EXCEPTION 'Game item not found'; END IF;

  v_total := round(v_item.shop_price * p_quantity, 4);

  SELECT id INTO v_account_id
  FROM bank_accounts
  WHERE user_id = v_user_id AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Bank account not found'; END IF;

  v_reference := 'GAME-BUY-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 12));

  INSERT INTO transactions (
    reference_id, type, status, amount, from_account_id,
    initiated_by, description, completed_at, metadata
  ) VALUES (
    v_reference, 'game_purchase', 'completed', v_total, v_account_id,
    v_user_id, 'Buy ' || p_quantity::TEXT || ' ' || v_item.name,
    now(),
    jsonb_build_object('item_id', v_item.id, 'quantity', p_quantity, 'unit_price', v_item.shop_price)
  ) RETURNING id INTO v_tx_id;

  PERFORM apply_ledger_entry(v_tx_id, v_account_id, 'debit', v_total);

  INSERT INTO user_inventory (user_id, item_id, quantity, purchase_price)
  VALUES (v_user_id, v_item.id, p_quantity, v_item.shop_price)
  ON CONFLICT (user_id, item_id) DO UPDATE SET
    purchase_price = round(
      ((user_inventory.purchase_price * user_inventory.quantity)
        + (EXCLUDED.purchase_price * EXCLUDED.quantity))
      / (user_inventory.quantity + EXCLUDED.quantity),
      4
    ),
    quantity = user_inventory.quantity + EXCLUDED.quantity;

  INSERT INTO notifications (user_id, type, title, body, metadata)
  VALUES (
    v_user_id, 'game_item', 'Item purchased',
    'Bought ' || p_quantity::TEXT || ' ' || v_item.name || ' for $' || v_total::TEXT,
    jsonb_build_object('item_id', v_item.id, 'quantity', p_quantity, 'transaction_id', v_tx_id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'item_id', v_item.id,
    'quantity', p_quantity,
    'transaction_id', v_tx_id,
    'reference_id', v_reference,
    'total', v_total
  );
END;
$$;

CREATE OR REPLACE FUNCTION sell_game_item(
  p_item_id UUID,
  p_quantity INT DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_frozen BOOLEAN;
  v_item game_items%ROWTYPE;
  v_inventory user_inventory%ROWTYPE;
  v_account_id UUID;
  v_credit NUMERIC;
  v_tx_id UUID;
  v_reference TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN RAISE EXCEPTION 'Quantity must be positive'; END IF;

  SELECT is_frozen INTO v_frozen FROM profiles WHERE id = v_user_id;
  IF COALESCE(v_frozen, false) THEN RAISE EXCEPTION 'Your account is frozen'; END IF;

  SELECT * INTO v_item
  FROM game_items
  WHERE id = p_item_id AND is_active = true;

  IF NOT FOUND THEN RAISE EXCEPTION 'Game item not found'; END IF;

  SELECT * INTO v_inventory
  FROM user_inventory
  WHERE user_id = v_user_id AND item_id = p_item_id
  FOR UPDATE;

  IF NOT FOUND OR v_inventory.quantity < p_quantity THEN
    RAISE EXCEPTION 'Insufficient item quantity';
  END IF;

  v_credit := round(v_item.shop_price * v_item.sell_back_rate * p_quantity, 4);

  SELECT id INTO v_account_id
  FROM bank_accounts
  WHERE user_id = v_user_id AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Bank account not found'; END IF;

  IF v_inventory.quantity = p_quantity THEN
    DELETE FROM user_inventory WHERE id = v_inventory.id;
  ELSE
    UPDATE user_inventory
    SET quantity = quantity - p_quantity
    WHERE id = v_inventory.id;
  END IF;

  v_reference := 'GAME-SELL-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 12));

  INSERT INTO transactions (
    reference_id, type, status, amount, to_account_id,
    initiated_by, description, completed_at, metadata
  ) VALUES (
    v_reference, 'game_sale', 'completed', v_credit, v_account_id,
    v_user_id, 'Sell ' || p_quantity::TEXT || ' ' || v_item.name,
    now(),
    jsonb_build_object('item_id', v_item.id, 'quantity', p_quantity, 'sell_back_rate', v_item.sell_back_rate)
  ) RETURNING id INTO v_tx_id;

  PERFORM apply_ledger_entry(v_tx_id, v_account_id, 'credit', v_credit);

  INSERT INTO notifications (user_id, type, title, body, metadata)
  VALUES (
    v_user_id, 'game_item', 'Item sold',
    'Sold ' || p_quantity::TEXT || ' ' || v_item.name || ' for $' || v_credit::TEXT,
    jsonb_build_object('item_id', v_item.id, 'quantity', p_quantity, 'transaction_id', v_tx_id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'item_id', v_item.id,
    'quantity', p_quantity,
    'transaction_id', v_tx_id,
    'reference_id', v_reference,
    'credit', v_credit
  );
END;
$$;

CREATE OR REPLACE FUNCTION list_inventory_item(
  p_item_id UUID,
  p_quantity INT,
  p_price NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_frozen BOOLEAN;
  v_inventory user_inventory%ROWTYPE;
  v_listing_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN RAISE EXCEPTION 'Quantity must be positive'; END IF;
  IF p_price IS NULL OR p_price <= 0 THEN RAISE EXCEPTION 'Price must be positive'; END IF;
  IF p_price != trunc(p_price, 4) THEN RAISE EXCEPTION 'Invalid price precision'; END IF;

  SELECT is_frozen INTO v_frozen FROM profiles WHERE id = v_user_id;
  IF COALESCE(v_frozen, false) THEN RAISE EXCEPTION 'Your account is frozen'; END IF;

  SELECT * INTO v_inventory
  FROM user_inventory
  WHERE user_id = v_user_id AND item_id = p_item_id
  FOR UPDATE;

  IF NOT FOUND OR v_inventory.quantity < p_quantity THEN
    RAISE EXCEPTION 'Insufficient item quantity';
  END IF;

  IF v_inventory.quantity = p_quantity THEN
    DELETE FROM user_inventory WHERE id = v_inventory.id;
  ELSE
    UPDATE user_inventory
    SET quantity = quantity - p_quantity
    WHERE id = v_inventory.id;
  END IF;

  INSERT INTO item_listings (seller_id, item_id, quantity, price, status)
  VALUES (v_user_id, p_item_id, p_quantity, p_price, 'active')
  RETURNING id INTO v_listing_id;

  RETURN jsonb_build_object('success', true, 'listing_id', v_listing_id);
END;
$$;

CREATE OR REPLACE FUNCTION cancel_item_listing(p_listing_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_listing item_listings%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_listing
  FROM item_listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Listing not found'; END IF;
  IF v_listing.seller_id != v_user_id THEN RAISE EXCEPTION 'You are not the seller'; END IF;
  IF v_listing.status != 'active' THEN RAISE EXCEPTION 'Listing is not active'; END IF;

  INSERT INTO user_inventory (user_id, item_id, quantity, purchase_price)
  VALUES (
    v_user_id,
    v_listing.item_id,
    v_listing.quantity,
    round(v_listing.price / v_listing.quantity, 4)
  )
  ON CONFLICT (user_id, item_id) DO UPDATE SET
    purchase_price = round(
      ((user_inventory.purchase_price * user_inventory.quantity)
        + (EXCLUDED.purchase_price * EXCLUDED.quantity))
      / (user_inventory.quantity + EXCLUDED.quantity),
      4
    ),
    quantity = user_inventory.quantity + EXCLUDED.quantity;

  UPDATE item_listings
  SET status = 'cancelled'
  WHERE id = v_listing.id;

  RETURN jsonb_build_object('success', true, 'listing_id', v_listing.id, 'status', 'cancelled');
END;
$$;

CREATE OR REPLACE FUNCTION buy_item_listing(p_listing_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buyer_id UUID;
  v_frozen BOOLEAN;
  v_listing item_listings%ROWTYPE;
  v_item_name TEXT;
  v_buyer_account_id UUID;
  v_seller_account_id UUID;
  v_tx_id UUID;
  v_reference TEXT;
  v_unit_price NUMERIC;
BEGIN
  v_buyer_id := auth.uid();
  IF v_buyer_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT is_frozen INTO v_frozen FROM profiles WHERE id = v_buyer_id;
  IF COALESCE(v_frozen, false) THEN RAISE EXCEPTION 'Your account is frozen'; END IF;

  SELECT * INTO v_listing
  FROM item_listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Listing not found'; END IF;
  IF v_listing.status != 'active' THEN RAISE EXCEPTION 'Listing is not active'; END IF;
  IF v_listing.seller_id = v_buyer_id THEN RAISE EXCEPTION 'Cannot buy your own listing'; END IF;

  SELECT name INTO v_item_name FROM game_items WHERE id = v_listing.item_id;

  SELECT id INTO v_buyer_account_id
  FROM bank_accounts
  WHERE user_id = v_buyer_id AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Buyer bank account not found'; END IF;

  SELECT id INTO v_seller_account_id
  FROM bank_accounts
  WHERE user_id = v_listing.seller_id AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Seller bank account not found'; END IF;

  v_reference := 'ITEM-TRADE-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 12));

  INSERT INTO transactions (
    reference_id, type, status, amount, from_account_id, to_account_id,
    initiated_by, description, completed_at, metadata
  ) VALUES (
    v_reference, 'item_trade', 'completed', v_listing.price,
    v_buyer_account_id, v_seller_account_id, v_buyer_id,
    'Buy ' || v_listing.quantity::TEXT || ' ' || COALESCE(v_item_name, 'game item'),
    now(),
    jsonb_build_object('listing_id', v_listing.id, 'item_id', v_listing.item_id, 'quantity', v_listing.quantity)
  ) RETURNING id INTO v_tx_id;

  PERFORM apply_ledger_entry(v_tx_id, v_buyer_account_id, 'debit', v_listing.price);
  PERFORM apply_ledger_entry(v_tx_id, v_seller_account_id, 'credit', v_listing.price);

  UPDATE item_listings
  SET status = 'sold', buyer_id = v_buyer_id, sold_at = now()
  WHERE id = v_listing.id;

  v_unit_price := round(v_listing.price / v_listing.quantity, 4);

  INSERT INTO user_inventory (user_id, item_id, quantity, purchase_price)
  VALUES (v_buyer_id, v_listing.item_id, v_listing.quantity, v_unit_price)
  ON CONFLICT (user_id, item_id) DO UPDATE SET
    purchase_price = round(
      ((user_inventory.purchase_price * user_inventory.quantity)
        + (EXCLUDED.purchase_price * EXCLUDED.quantity))
      / (user_inventory.quantity + EXCLUDED.quantity),
      4
    ),
    quantity = user_inventory.quantity + EXCLUDED.quantity;

  INSERT INTO notifications (user_id, type, title, body, metadata)
  VALUES
    (
      v_buyer_id, 'game_item', 'Marketplace purchase complete',
      'Bought ' || v_listing.quantity::TEXT || ' ' || COALESCE(v_item_name, 'game item') || ' for $' || v_listing.price::TEXT,
      jsonb_build_object('listing_id', v_listing.id, 'transaction_id', v_tx_id)
    ),
    (
      v_listing.seller_id, 'game_item', 'Marketplace item sold',
      'Sold ' || v_listing.quantity::TEXT || ' ' || COALESCE(v_item_name, 'game item') || ' for $' || v_listing.price::TEXT,
      jsonb_build_object('listing_id', v_listing.id, 'buyer_id', v_buyer_id, 'transaction_id', v_tx_id)
    );

  RETURN jsonb_build_object(
    'success', true,
    'listing_id', v_listing.id,
    'transaction_id', v_tx_id,
    'reference_id', v_reference,
    'total', v_listing.price
  );
END;
$$;

GRANT EXECUTE ON FUNCTION buy_game_item(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION sell_game_item(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION list_inventory_item(UUID, INT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_item_listing(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION buy_item_listing(UUID) TO authenticated;
