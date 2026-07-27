-- =============================================================================
-- TriangleBank — Complete Database Schema (Single File)
-- Run this entire script once in Supabase SQL Editor on a fresh project.
-- =============================================================================

-- ─── EXTENSIONS & ENUMS ───────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE account_status AS ENUM ('active', 'frozen', 'closed');
CREATE TYPE transaction_type AS ENUM (
  'transfer', 'deposit', 'withdrawal', 'stock_buy', 'stock_sell', 'admin_mint', 'fee'
);
CREATE TYPE transaction_status AS ENUM (
  'pending', 'processing', 'completed', 'failed', 'cancelled'
);
CREATE TYPE ledger_entry_type AS ENUM ('debit', 'credit');
CREATE TYPE order_side AS ENUM ('buy', 'sell');
CREATE TYPE order_type AS ENUM ('market', 'limit');
CREATE TYPE order_status AS ENUM ('pending', 'partial', 'filled', 'cancelled', 'rejected');
CREATE TYPE notification_type AS ENUM (
  'transfer_received', 'transfer_sent', 'transfer_failed',
  'account_frozen', 'account_unfrozen', 'stock_order_filled',
  'stock_order_rejected', 'admin_action', 'system'
);

-- ─── CORE BANKING TABLES ──────────────────────────────────────────────────────

CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  triangle_id   TEXT NOT NULL,
  username      TEXT NOT NULL,
  email         TEXT NOT NULL,
  full_name     TEXT,
  avatar_url    TEXT,
  is_frozen     BOOLEAN NOT NULL DEFAULT false,
  is_admin      BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profiles_triangle_id_format CHECK (triangle_id ~ '^TR-\d{4}-\d{4}-\d{4}$'),
  CONSTRAINT profiles_username_length CHECK (char_length(username) BETWEEN 3 AND 32),
  CONSTRAINT profiles_username_format CHECK (username ~ '^[a-zA-Z0-9_]+$')
);
CREATE UNIQUE INDEX idx_profiles_triangle_id ON profiles (triangle_id);
CREATE UNIQUE INDEX idx_profiles_username ON profiles (username);
CREATE UNIQUE INDEX idx_profiles_email ON profiles (email);
CREATE INDEX idx_profiles_is_frozen ON profiles (is_frozen) WHERE is_frozen = true;
CREATE INDEX idx_profiles_created_at ON profiles (created_at DESC);

CREATE TABLE bank_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_number  TEXT NOT NULL,
  balance         NUMERIC(19, 4) NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'USD',
  status          account_status NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bank_accounts_balance_non_negative CHECK (balance >= 0),
  CONSTRAINT bank_accounts_currency_format CHECK (currency ~ '^[A-Z]{3}$'),
  CONSTRAINT bank_accounts_account_number_format CHECK (account_number ~ '^AC-[A-Z0-9]{12}$')
);
CREATE UNIQUE INDEX idx_bank_accounts_account_number ON bank_accounts (account_number);
CREATE UNIQUE INDEX idx_bank_accounts_user_id ON bank_accounts (user_id);
CREATE INDEX idx_bank_accounts_status ON bank_accounts (status);

CREATE TABLE transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id      TEXT NOT NULL,
  type              transaction_type NOT NULL,
  status            transaction_status NOT NULL DEFAULT 'pending',
  amount            NUMERIC(19, 4) NOT NULL,
  fee               NUMERIC(19, 4) NOT NULL DEFAULT 0,
  from_account_id   UUID REFERENCES bank_accounts(id),
  to_account_id     UUID REFERENCES bank_accounts(id),
  initiated_by      UUID NOT NULL REFERENCES profiles(id),
  description       TEXT,
  metadata          JSONB NOT NULL DEFAULT '{}',
  idempotency_key   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ,
  CONSTRAINT transactions_amount_positive CHECK (amount > 0),
  CONSTRAINT transactions_fee_non_negative CHECK (fee >= 0),
  CONSTRAINT transactions_reference_id_format CHECK (char_length(reference_id) >= 8)
);
CREATE UNIQUE INDEX idx_transactions_reference_id ON transactions (reference_id);
CREATE UNIQUE INDEX idx_transactions_idempotency_key ON transactions (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_transactions_from_account ON transactions (from_account_id);
CREATE INDEX idx_transactions_to_account ON transactions (to_account_id);
CREATE INDEX idx_transactions_initiated_by ON transactions (initiated_by);
CREATE INDEX idx_transactions_status ON transactions (status);
CREATE INDEX idx_transactions_type ON transactions (type);
CREATE INDEX idx_transactions_created_at ON transactions (created_at DESC);

CREATE TABLE ledger_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  UUID NOT NULL REFERENCES transactions(id),
  account_id      UUID NOT NULL REFERENCES bank_accounts(id),
  entry_type      ledger_entry_type NOT NULL,
  amount          NUMERIC(19, 4) NOT NULL,
  balance_after   NUMERIC(19, 4) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ledger_entries_amount_positive CHECK (amount > 0),
  CONSTRAINT ledger_entries_balance_non_negative CHECK (balance_after >= 0)
);
CREATE INDEX idx_ledger_entries_transaction_id ON ledger_entries (transaction_id);
CREATE INDEX idx_ledger_entries_account_id ON ledger_entries (account_id);
CREATE INDEX idx_ledger_entries_created_at ON ledger_entries (created_at DESC);
CREATE INDEX idx_ledger_entries_account_created ON ledger_entries (account_id, created_at DESC);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user_id ON notifications (user_id);
CREATE INDEX idx_notifications_user_unread ON notifications (user_id, created_at DESC) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications (created_at DESC);

-- ─── STOCK MARKET TABLES ──────────────────────────────────────────────────────

CREATE TABLE stock_symbols (
  symbol        TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  sector        TEXT,
  exchange      TEXT NOT NULL DEFAULT 'NASDAQ',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT stock_symbols_symbol_format CHECK (symbol ~ '^[A-Z]{1,10}$')
);
CREATE INDEX idx_stock_symbols_is_active ON stock_symbols (is_active) WHERE is_active = true;

CREATE TABLE stock_prices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol          TEXT NOT NULL REFERENCES stock_symbols(symbol),
  price           NUMERIC(19, 4) NOT NULL,
  change_amount   NUMERIC(19, 4) NOT NULL DEFAULT 0,
  change_percent  NUMERIC(8, 4) NOT NULL DEFAULT 0,
  volume          BIGINT NOT NULL DEFAULT 0,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT stock_prices_price_positive CHECK (price > 0)
);
CREATE INDEX idx_stock_prices_symbol ON stock_prices (symbol);
CREATE INDEX idx_stock_prices_symbol_recorded ON stock_prices (symbol, recorded_at DESC);

CREATE TABLE portfolios (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  symbol          TEXT NOT NULL REFERENCES stock_symbols(symbol),
  quantity        NUMERIC(19, 6) NOT NULL DEFAULT 0,
  average_cost    NUMERIC(19, 4) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT portfolios_quantity_non_negative CHECK (quantity >= 0),
  CONSTRAINT portfolios_average_cost_non_negative CHECK (average_cost >= 0),
  CONSTRAINT portfolios_user_symbol_unique UNIQUE (user_id, symbol)
);
CREATE INDEX idx_portfolios_user_id ON portfolios (user_id);
CREATE INDEX idx_portfolios_symbol ON portfolios (symbol);

CREATE TABLE stock_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id),
  symbol          TEXT NOT NULL REFERENCES stock_symbols(symbol),
  side            order_side NOT NULL,
  order_type      order_type NOT NULL DEFAULT 'market',
  quantity        NUMERIC(19, 6) NOT NULL,
  limit_price     NUMERIC(19, 4),
  filled_quantity NUMERIC(19, 6) NOT NULL DEFAULT 0,
  status          order_status NOT NULL DEFAULT 'pending',
  idempotency_key TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  executed_at     TIMESTAMPTZ,
  CONSTRAINT stock_orders_quantity_positive CHECK (quantity > 0),
  CONSTRAINT stock_orders_filled_quantity_valid CHECK (filled_quantity >= 0 AND filled_quantity <= quantity)
);
CREATE UNIQUE INDEX idx_stock_orders_idempotency_key ON stock_orders (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_stock_orders_user_id ON stock_orders (user_id);
CREATE INDEX idx_stock_orders_symbol ON stock_orders (symbol);
CREATE INDEX idx_stock_orders_status ON stock_orders (status);
CREATE INDEX idx_stock_orders_created_at ON stock_orders (created_at DESC);

CREATE TABLE trades (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES stock_orders(id),
  user_id     UUID NOT NULL REFERENCES profiles(id),
  symbol      TEXT NOT NULL REFERENCES stock_symbols(symbol),
  side        order_side NOT NULL,
  quantity    NUMERIC(19, 6) NOT NULL,
  price       NUMERIC(19, 4) NOT NULL,
  total       NUMERIC(19, 4) NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT trades_quantity_positive CHECK (quantity > 0),
  CONSTRAINT trades_price_positive CHECK (price > 0),
  CONSTRAINT trades_total_positive CHECK (total > 0)
);
CREATE INDEX idx_trades_order_id ON trades (order_id);
CREATE INDEX idx_trades_user_id ON trades (user_id);
CREATE INDEX idx_trades_symbol ON trades (symbol);
CREATE INDEX idx_trades_executed_at ON trades (executed_at DESC);

CREATE TABLE stock_favorites (
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  symbol      TEXT NOT NULL REFERENCES stock_symbols(symbol),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, symbol)
);

CREATE OR REPLACE VIEW latest_stock_prices AS
SELECT DISTINCT ON (symbol) symbol, price, change_amount, change_percent, volume, recorded_at
FROM stock_prices ORDER BY symbol, recorded_at DESC;

-- ─── ADMIN, AUDIT, SETTINGS, SESSIONS ─────────────────────────────────────────

CREATE TABLE admin_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id        UUID NOT NULL REFERENCES profiles(id),
  action          TEXT NOT NULL,
  target_user_id  UUID REFERENCES profiles(id),
  details         JSONB NOT NULL DEFAULT '{}',
  ip_address      INET,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_logs_admin_id ON admin_logs (admin_id);
CREATE INDEX idx_admin_logs_target_user_id ON admin_logs (target_user_id);
CREATE INDEX idx_admin_logs_action ON admin_logs (action);
CREATE INDEX idx_admin_logs_created_at ON admin_logs (created_at DESC);

CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES profiles(id),
  action          TEXT NOT NULL,
  resource_type   TEXT NOT NULL,
  resource_id     UUID,
  ip_address      INET,
  user_agent      TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs (resource_type, resource_id);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);

CREATE TABLE settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  UUID REFERENCES profiles(id)
);

CREATE TABLE sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ip_address      INET,
  user_agent      TEXT,
  last_active_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at      TIMESTAMPTZ
);
CREATE INDEX idx_sessions_user_id ON sessions (user_id);
CREATE INDEX idx_sessions_last_active ON sessions (last_active_at DESC);
CREATE INDEX idx_sessions_active ON sessions (user_id) WHERE revoked_at IS NULL;

INSERT INTO settings (key, value, description) VALUES
  ('transfer_daily_limit', '{"amount": 10000, "currency": "USD"}', 'Daily transfer limit per user'),
  ('transfer_single_limit', '{"amount": 5000, "currency": "USD"}', 'Single transfer limit'),
  ('transfer_fee_percent', '{"percent": 0}', 'Transfer fee percentage'),
  ('stock_trading_enabled', '{"enabled": true}', 'Enable/disable stock trading'),
  ('maintenance_mode', '{"enabled": false, "message": ""}', 'Platform maintenance mode');

-- ─── FUNCTIONS & TRIGGERS ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER trg_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER trg_stock_symbols_updated_at BEFORE UPDATE ON stock_symbols FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER trg_portfolios_updated_at BEFORE UPDATE ON portfolios FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE OR REPLACE FUNCTION generate_triangle_id()
RETURNS TEXT LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id TEXT; v_exists BOOLEAN;
BEGIN
  LOOP
    v_id := 'TR-' || lpad((floor(random()*10000))::INT::TEXT,4,'0') || '-'
         || lpad((floor(random()*10000))::INT::TEXT,4,'0') || '-'
         || lpad((floor(random()*10000))::INT::TEXT,4,'0');
    SELECT EXISTS(SELECT 1 FROM profiles WHERE triangle_id = v_id) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION generate_account_number()
RETURNS TEXT LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_num TEXT; v_exists BOOLEAN;
BEGIN
  LOOP
    v_num := 'AC-' || upper(substr(replace(gen_random_uuid()::TEXT,'-',''),1,12));
    SELECT EXISTS(SELECT 1 FROM bank_accounts WHERE account_number = v_num) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_num;
END; $$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND username = 'demirsarpk' AND is_admin = true AND is_frozen = false);
$$;

CREATE OR REPLACE FUNCTION owns_account(p_account_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM bank_accounts WHERE id = p_account_id AND user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION get_account_by_triangle_id(p_triangle_id TEXT)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ba.id FROM bank_accounts ba JOIN profiles p ON p.id = ba.user_id
  WHERE p.triangle_id = p_triangle_id AND p.is_frozen = false AND ba.status = 'active';
$$;

CREATE OR REPLACE FUNCTION prevent_direct_balance_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.balance IS DISTINCT FROM NEW.balance THEN
    IF current_setting('trianglebank.balance_update', true) IS DISTINCT FROM 'allowed' THEN
      RAISE EXCEPTION 'Direct balance updates are not permitted';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_prevent_direct_balance_update BEFORE UPDATE ON bank_accounts FOR EACH ROW EXECUTE PROCEDURE prevent_direct_balance_update();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_username TEXT; v_is_admin BOOLEAN;
BEGIN
  v_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1));
  v_is_admin := (lower(v_username) = 'demirsarpk');
  INSERT INTO profiles (id, triangle_id, username, email, full_name, is_admin)
  VALUES (NEW.id, generate_triangle_id(), v_username, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name',''), v_is_admin);
  INSERT INTO bank_accounts (user_id, account_number) VALUES (NEW.id, generate_account_number());
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

CREATE OR REPLACE FUNCTION create_audit_log(p_action TEXT, p_resource_type TEXT, p_resource_id UUID DEFAULT NULL, p_metadata JSONB DEFAULT '{}')
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (auth.uid(), p_action, p_resource_type, p_resource_id, p_metadata) RETURNING id INTO v_log_id;
  RETURN v_log_id;
END; $$;

CREATE OR REPLACE FUNCTION apply_ledger_entry(p_transaction_id UUID, p_account_id UUID, p_entry_type ledger_entry_type, p_amount NUMERIC)
RETURNS NUMERIC LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_current_balance NUMERIC; v_new_balance NUMERIC;
BEGIN
  SELECT balance INTO v_current_balance FROM bank_accounts WHERE id = p_account_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Account not found: %', p_account_id; END IF;
  IF p_entry_type = 'debit' THEN
    v_new_balance := v_current_balance - p_amount;
    IF v_new_balance < 0 THEN RAISE EXCEPTION 'Insufficient funds'; END IF;
  ELSE v_new_balance := v_current_balance + p_amount;
  END IF;
  PERFORM set_config('trianglebank.balance_update', 'allowed', true);
  UPDATE bank_accounts SET balance = v_new_balance WHERE id = p_account_id;
  PERFORM set_config('trianglebank.balance_update', '', true);
  INSERT INTO ledger_entries (transaction_id, account_id, entry_type, amount, balance_after)
  VALUES (p_transaction_id, p_account_id, p_entry_type, p_amount, v_new_balance);
  RETURN v_new_balance;
END; $$;

-- ─── STORED PROCEDURES ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION transfer_funds(p_to_triangle_id TEXT, p_amount NUMERIC, p_description TEXT DEFAULT NULL, p_idempotency_key TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_sender_id UUID; v_sender_account_id UUID; v_receiver_account_id UUID; v_receiver_user_id UUID;
  v_transaction_id UUID; v_reference_id TEXT; v_existing_tx UUID; v_sender_frozen BOOLEAN;
  v_daily_total NUMERIC; v_daily_limit NUMERIC; v_single_limit NUMERIC;
BEGIN
  v_sender_id := auth.uid();
  IF v_sender_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing_tx FROM transactions WHERE idempotency_key = p_idempotency_key;
    IF FOUND THEN RETURN jsonb_build_object('success',true,'transaction_id',v_existing_tx,'duplicate',true); END IF;
  END IF;
  SELECT is_frozen INTO v_sender_frozen FROM profiles WHERE id = v_sender_id;
  IF v_sender_frozen THEN RAISE EXCEPTION 'Your account is frozen'; END IF;
  SELECT (value->>'amount')::NUMERIC INTO v_daily_limit FROM settings WHERE key = 'transfer_daily_limit';
  SELECT (value->>'amount')::NUMERIC INTO v_single_limit FROM settings WHERE key = 'transfer_single_limit';
  IF p_amount > COALESCE(v_single_limit,5000) THEN RAISE EXCEPTION 'Amount exceeds single transfer limit'; END IF;
  SELECT COALESCE(SUM(amount),0) INTO v_daily_total FROM transactions
  WHERE initiated_by = v_sender_id AND type = 'transfer' AND status = 'completed' AND created_at >= date_trunc('day',now());
  IF v_daily_total + p_amount > COALESCE(v_daily_limit,10000) THEN RAISE EXCEPTION 'Daily transfer limit exceeded'; END IF;
  SELECT id INTO v_sender_account_id FROM bank_accounts WHERE user_id = v_sender_id AND status = 'active' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sender account not found'; END IF;
  SELECT ba.id, ba.user_id INTO v_receiver_account_id, v_receiver_user_id FROM bank_accounts ba
  JOIN profiles p ON p.id = ba.user_id WHERE p.triangle_id = p_to_triangle_id AND p.is_frozen = false AND ba.status = 'active' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Recipient not found or account inactive'; END IF;
  IF v_sender_account_id = v_receiver_account_id THEN RAISE EXCEPTION 'Cannot transfer to yourself'; END IF;
  v_reference_id := 'TXN-' || upper(substr(replace(gen_random_uuid()::TEXT,'-',''),1,16));
  INSERT INTO transactions (reference_id,type,status,amount,from_account_id,to_account_id,initiated_by,description,idempotency_key,completed_at)
  VALUES (v_reference_id,'transfer','processing',p_amount,v_sender_account_id,v_receiver_account_id,v_sender_id,p_description,p_idempotency_key,now())
  RETURNING id INTO v_transaction_id;
  PERFORM apply_ledger_entry(v_transaction_id,v_sender_account_id,'debit',p_amount);
  PERFORM apply_ledger_entry(v_transaction_id,v_receiver_account_id,'credit',p_amount);
  UPDATE transactions SET status = 'completed' WHERE id = v_transaction_id;
  INSERT INTO notifications (user_id,type,title,body,metadata) VALUES
    (v_receiver_user_id,'transfer_received','Money received','You received $'||p_amount::TEXT||' from a TriangleBank user.',jsonb_build_object('transaction_id',v_transaction_id,'amount',p_amount)),
    (v_sender_id,'transfer_sent','Transfer sent','You sent $'||p_amount::TEXT||' successfully.',jsonb_build_object('transaction_id',v_transaction_id,'amount',p_amount));
  PERFORM create_audit_log('transfer_completed','transaction',v_transaction_id,jsonb_build_object('amount',p_amount,'to_triangle_id',p_to_triangle_id));
  RETURN jsonb_build_object('success',true,'transaction_id',v_transaction_id,'reference_id',v_reference_id);
EXCEPTION WHEN OTHERS THEN
  IF v_transaction_id IS NOT NULL THEN UPDATE transactions SET status = 'failed' WHERE id = v_transaction_id; END IF;
  RAISE;
END; $$;

CREATE OR REPLACE FUNCTION admin_mint_funds(p_target_triangle_id TEXT, p_amount NUMERIC, p_reason TEXT DEFAULT 'Admin mint')
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_account_id UUID; v_target_user_id UUID; v_transaction_id UUID; v_reference_id TEXT;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;
  SELECT ba.id, ba.user_id INTO v_account_id, v_target_user_id FROM bank_accounts ba
  JOIN profiles p ON p.id = ba.user_id WHERE p.triangle_id = p_target_triangle_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Target account not found'; END IF;
  v_reference_id := 'MINT-' || upper(substr(replace(gen_random_uuid()::TEXT,'-',''),1,16));
  INSERT INTO transactions (reference_id,type,status,amount,to_account_id,initiated_by,description,completed_at)
  VALUES (v_reference_id,'admin_mint','completed',p_amount,v_account_id,auth.uid(),p_reason,now()) RETURNING id INTO v_transaction_id;
  PERFORM apply_ledger_entry(v_transaction_id,v_account_id,'credit',p_amount);
  INSERT INTO admin_logs (admin_id,action,target_user_id,details) VALUES (auth.uid(),'mint_funds',v_target_user_id,jsonb_build_object('amount',p_amount,'reason',p_reason,'triangle_id',p_target_triangle_id));
  INSERT INTO notifications (user_id,type,title,body,metadata) VALUES (v_target_user_id,'admin_action','Funds added','$'||p_amount::TEXT||' has been added to your account.',jsonb_build_object('transaction_id',v_transaction_id,'amount',p_amount));
  RETURN jsonb_build_object('success',true,'transaction_id',v_transaction_id,'reference_id',v_reference_id);
END; $$;

CREATE OR REPLACE FUNCTION admin_freeze_user(p_target_triangle_id TEXT, p_reason TEXT DEFAULT 'Policy violation')
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_target_user_id UUID;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;
  SELECT id INTO v_target_user_id FROM profiles WHERE triangle_id = p_target_triangle_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;
  IF v_target_user_id = auth.uid() THEN RAISE EXCEPTION 'Cannot freeze your own account'; END IF;
  UPDATE profiles SET is_frozen = true WHERE id = v_target_user_id;
  UPDATE bank_accounts SET status = 'frozen' WHERE user_id = v_target_user_id;
  INSERT INTO admin_logs (admin_id,action,target_user_id,details) VALUES (auth.uid(),'freeze_user',v_target_user_id,jsonb_build_object('reason',p_reason));
  INSERT INTO notifications (user_id,type,title,body) VALUES (v_target_user_id,'account_frozen','Account frozen','Your account has been frozen. Contact support for assistance.');
  RETURN jsonb_build_object('success',true,'user_id',v_target_user_id);
END; $$;

CREATE OR REPLACE FUNCTION admin_unfreeze_user(p_target_triangle_id TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_target_user_id UUID;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;
  SELECT id INTO v_target_user_id FROM profiles WHERE triangle_id = p_target_triangle_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;
  UPDATE profiles SET is_frozen = false WHERE id = v_target_user_id;
  UPDATE bank_accounts SET status = 'active' WHERE user_id = v_target_user_id;
  INSERT INTO admin_logs (admin_id,action,target_user_id,details) VALUES (auth.uid(),'unfreeze_user',v_target_user_id,'{}');
  INSERT INTO notifications (user_id,type,title,body) VALUES (v_target_user_id,'account_unfrozen','Account restored','Your account has been unfrozen. Welcome back!');
  RETURN jsonb_build_object('success',true,'user_id',v_target_user_id);
END; $$;

CREATE OR REPLACE FUNCTION search_users(p_query TEXT)
RETURNS TABLE (triangle_id TEXT, username TEXT, full_name TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.triangle_id, p.username, p.full_name FROM profiles p
  WHERE p.is_frozen = false AND (p.triangle_id ILIKE '%'||p_query||'%' OR p.username ILIKE '%'||p_query||'%') AND p.id != auth.uid()
  ORDER BY p.username LIMIT 20;
$$;

GRANT EXECUTE ON FUNCTION transfer_funds TO authenticated;
GRANT EXECUTE ON FUNCTION search_users TO authenticated;
GRANT EXECUTE ON FUNCTION admin_mint_funds TO authenticated;
GRANT EXECUTE ON FUNCTION admin_freeze_user TO authenticated;
GRANT EXECUTE ON FUNCTION admin_unfreeze_user TO authenticated;

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_symbols ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles FOR SELECT TO authenticated USING (id = auth.uid() OR is_admin());
CREATE POLICY "profiles_select_public_search" ON profiles FOR SELECT TO authenticated USING (is_frozen = false AND id != auth.uid());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid() AND is_admin = (SELECT p.is_admin FROM profiles p WHERE p.id = auth.uid()) AND is_frozen = (SELECT p.is_frozen FROM profiles p WHERE p.id = auth.uid()));
CREATE POLICY "bank_accounts_select_own" ON bank_accounts FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "transactions_select_own" ON transactions FOR SELECT TO authenticated
  USING (initiated_by = auth.uid() OR from_account_id IN (SELECT id FROM bank_accounts WHERE user_id = auth.uid()) OR to_account_id IN (SELECT id FROM bank_accounts WHERE user_id = auth.uid()) OR is_admin());
CREATE POLICY "ledger_entries_select_own" ON ledger_entries FOR SELECT TO authenticated
  USING (account_id IN (SELECT id FROM bank_accounts WHERE user_id = auth.uid()) OR is_admin());
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "stock_symbols_select_all" ON stock_symbols FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "stock_prices_select_all" ON stock_prices FOR SELECT TO authenticated USING (true);
CREATE POLICY "portfolios_select_own" ON portfolios FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "stock_orders_select_own" ON stock_orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "trades_select_own" ON trades FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "stock_favorites_select_own" ON stock_favorites FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "stock_favorites_insert_own" ON stock_favorites FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "stock_favorites_delete_own" ON stock_favorites FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admin_logs_select_admin" ON admin_logs FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "audit_logs_select_admin" ON audit_logs FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "audit_logs_select_own" ON audit_logs FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "settings_select_all" ON settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings_update_admin" ON settings FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "sessions_select_own" ON sessions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "sessions_insert_own" ON sessions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "sessions_update_own" ON sessions FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE bank_accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;

-- ─── SEED DATA ────────────────────────────────────────────────────────────────

INSERT INTO stock_symbols (symbol, name, sector, exchange) VALUES
  ('AAPL','Apple Inc.','Technology','NASDAQ'),('MSFT','Microsoft Corporation','Technology','NASDAQ'),
  ('NVDA','NVIDIA Corporation','Technology','NASDAQ'),('AMZN','Amazon.com Inc.','Consumer Cyclical','NASDAQ'),
  ('META','Meta Platforms Inc.','Technology','NASDAQ'),('TSLA','Tesla Inc.','Consumer Cyclical','NASDAQ'),
  ('AMD','Advanced Micro Devices','Technology','NASDAQ'),('INTC','Intel Corporation','Technology','NASDAQ'),
  ('NFLX','Netflix Inc.','Communication','NASDAQ'),('GOOGL','Alphabet Inc.','Technology','NASDAQ'),
  ('SPY','SPDR S&P 500 ETF','ETF','NYSE'),('QQQ','Invesco QQQ Trust','ETF','NASDAQ')
ON CONFLICT (symbol) DO NOTHING;

INSERT INTO stock_prices (symbol, price, change_amount, change_percent, volume) VALUES
  ('AAPL',227.50,1.25,0.55,45000000),('MSFT',415.80,2.10,0.51,22000000),
  ('NVDA',875.30,-5.40,-0.61,38000000),('AMZN',185.60,0.80,0.43,31000000),
  ('META',505.20,3.15,0.63,15000000),('TSLA',248.90,-2.30,-0.92,52000000),
  ('AMD',162.40,1.80,1.12,28000000),('INTC',22.15,-0.35,-1.55,42000000),
  ('NFLX',625.00,4.50,0.73,8000000),('GOOGL',175.30,0.95,0.54,19000000),
  ('SPY',545.20,1.10,0.20,65000000),('QQQ',475.80,2.40,0.51,40000000);

-- =============================================================================
-- Done. TriangleBank schema is ready.
-- =============================================================================
