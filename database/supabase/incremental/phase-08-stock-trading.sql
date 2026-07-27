-- =============================================================================
-- TriangleBank Phase 8 — Stock Trading RPCs
-- Run ONCE in Supabase SQL Editor AFTER using the stock market.
-- Do NOT re-run full_schema.sql.
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
      AND recorded_at >= now() - interval '15 minutes'
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
      AND recorded_at >= now() - interval '15 minutes'
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
