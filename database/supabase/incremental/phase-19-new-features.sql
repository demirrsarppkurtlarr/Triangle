-- =============================================================================
-- TriangleBank Phase 19 — Loans, Deposits, Forex, Crypto, Insurance, Chat,
--                         Battle Pass, Predictions, Custom Themes
-- Run ONCE after phase-18.
-- =============================================================================

-- ─── New transaction types ───────────────────────────────────────────────────
DO $$ BEGIN ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'loan_disbursement'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'loan_repayment'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'deposit_lock'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'deposit_unlock'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'forex_trade'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'crypto_trade'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'insurance_premium'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'insurance_claim'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'prediction_bet'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'prediction_win'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'battle_pass_reward'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'theme_purchase'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── New notification types ──────────────────────────────────────────────────
DO $$ BEGIN ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'loan'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'deposit_matured'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'chat_message'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'prediction'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'battle_pass'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. LOANS
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS loans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  principal       NUMERIC(19,4) NOT NULL,
  interest_rate   NUMERIC(5,4) NOT NULL DEFAULT 0.05,
  total_due       NUMERIC(19,4) NOT NULL,
  amount_paid     NUMERIC(19,4) NOT NULL DEFAULT 0,
  installments    INT NOT NULL DEFAULT 5,
  paid_count      INT NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paid','defaulted')),
  due_at          TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "loans_own" ON loans;
CREATE POLICY "loans_own" ON loans FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());

CREATE TABLE IF NOT EXISTS credit_scores (
  user_id         UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  score           INT NOT NULL DEFAULT 700 CHECK (score >= 300 AND score <= 850),
  loans_taken     INT NOT NULL DEFAULT 0,
  loans_repaid    INT NOT NULL DEFAULT 0,
  defaults        INT NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE credit_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "credit_scores_own" ON credit_scores;
CREATE POLICY "credit_scores_own" ON credit_scores FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. TERM DEPOSITS
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS term_deposits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount          NUMERIC(19,4) NOT NULL,
  interest_rate   NUMERIC(5,4) NOT NULL,
  term_days       INT NOT NULL,
  maturity_amount NUMERIC(19,4) NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','matured','withdrawn')),
  matures_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE term_deposits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "term_deposits_own" ON term_deposits;
CREATE POLICY "term_deposits_own" ON term_deposits FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. FOREX
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS forex_pairs (
  pair            TEXT PRIMARY KEY,
  base_currency   TEXT NOT NULL,
  quote_currency  TEXT NOT NULL,
  rate            NUMERIC(19,6) NOT NULL,
  prev_rate       NUMERIC(19,6) NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO forex_pairs (pair, base_currency, quote_currency, rate, prev_rate) VALUES
  ('EUR/USD', 'EUR', 'USD', 1.0850, 1.0850),
  ('GBP/USD', 'GBP', 'USD', 1.2720, 1.2720),
  ('USD/JPY', 'USD', 'JPY', 154.50, 154.50),
  ('USD/TRY', 'USD', 'TRY', 34.20, 34.20),
  ('EUR/GBP', 'EUR', 'GBP', 0.8530, 0.8530),
  ('AUD/USD', 'AUD', 'USD', 0.6480, 0.6480)
ON CONFLICT (pair) DO NOTHING;

CREATE TABLE IF NOT EXISTS forex_holdings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  currency        TEXT NOT NULL,
  amount          NUMERIC(19,4) NOT NULL DEFAULT 0,
  UNIQUE(user_id, currency)
);
ALTER TABLE forex_holdings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "forex_holdings_own" ON forex_holdings;
CREATE POLICY "forex_holdings_own" ON forex_holdings FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. CRYPTO
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS crypto_assets (
  symbol          TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  price           NUMERIC(19,4) NOT NULL,
  prev_price      NUMERIC(19,4) NOT NULL,
  volatility      NUMERIC(5,4) NOT NULL DEFAULT 0.03,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO crypto_assets (symbol, name, price, prev_price, volatility) VALUES
  ('TCOIN', 'TriCoin', 125.00, 125.00, 0.04),
  ('BGEM', 'BlockGem', 8.50, 8.50, 0.06),
  ('DBANK', 'DeltaBank Token', 42.00, 42.00, 0.05),
  ('NEON', 'NeonChain', 1.20, 1.20, 0.08),
  ('APEX', 'ApexLedger', 310.00, 310.00, 0.035),
  ('FLUX', 'FluxNet', 0.45, 0.45, 0.10)
ON CONFLICT (symbol) DO NOTHING;

CREATE TABLE IF NOT EXISTS crypto_holdings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  symbol          TEXT NOT NULL REFERENCES crypto_assets(symbol),
  quantity        NUMERIC(19,8) NOT NULL DEFAULT 0,
  average_cost    NUMERIC(19,4) NOT NULL DEFAULT 0,
  UNIQUE(user_id, symbol)
);
ALTER TABLE crypto_holdings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "crypto_holdings_own" ON crypto_holdings;
CREATE POLICY "crypto_holdings_own" ON crypto_holdings FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. INSURANCE
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS insurance_policies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  policy_type     TEXT NOT NULL CHECK (policy_type IN ('account','stock','crypto')),
  coverage_amount NUMERIC(19,4) NOT NULL,
  premium         NUMERIC(19,4) NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','claimed')),
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "insurance_own" ON insurance_policies;
CREATE POLICY "insurance_own" ON insurance_policies FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. CHAT
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS chat_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  channel         TEXT NOT NULL DEFAULT 'general',
  content         TEXT NOT NULL CHECK (char_length(content) <= 500),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chat_read" ON chat_messages;
CREATE POLICY "chat_read" ON chat_messages FOR SELECT TO authenticated
  USING (
    channel = 'general'
    OR sender_id = auth.uid()
    OR receiver_id = auth.uid()
  );
DROP POLICY IF EXISTS "chat_insert" ON chat_messages;
CREATE POLICY "chat_insert" ON chat_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. BATTLE PASS / SEASONS
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS seasons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  starts_at       TIMESTAMPTZ NOT NULL,
  ends_at         TIMESTAMPTZ NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS season_missions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id       UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  title_en        TEXT NOT NULL,
  title_tr        TEXT NOT NULL,
  description_en  TEXT NOT NULL DEFAULT '',
  description_tr  TEXT NOT NULL DEFAULT '',
  mission_type    TEXT NOT NULL,
  target_value    INT NOT NULL DEFAULT 1,
  xp_reward       INT NOT NULL DEFAULT 100,
  cash_reward     NUMERIC(19,4) NOT NULL DEFAULT 0,
  sort_order      INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_season_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  season_id       UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  mission_id      UUID NOT NULL REFERENCES season_missions(id) ON DELETE CASCADE,
  current_value   INT NOT NULL DEFAULT 0,
  completed       BOOLEAN NOT NULL DEFAULT false,
  claimed         BOOLEAN NOT NULL DEFAULT false,
  completed_at    TIMESTAMPTZ,
  UNIQUE(user_id, mission_id)
);
ALTER TABLE user_season_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "season_progress_own" ON user_season_progress;
CREATE POLICY "season_progress_own" ON user_season_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());

CREATE TABLE IF NOT EXISTS user_season_xp (
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  season_id       UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  total_xp        INT NOT NULL DEFAULT 0,
  level           INT NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, season_id)
);
ALTER TABLE user_season_xp ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "season_xp_own" ON user_season_xp;
CREATE POLICY "season_xp_own" ON user_season_xp FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. PREDICTIONS
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS predictions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol          TEXT NOT NULL,
  question_en     TEXT NOT NULL,
  question_tr     TEXT NOT NULL,
  direction       TEXT NOT NULL CHECK (direction IN ('up','down')),
  target_price    NUMERIC(19,4),
  resolves_at     TIMESTAMPTZ NOT NULL,
  resolved        BOOLEAN NOT NULL DEFAULT false,
  outcome         TEXT CHECK (outcome IN ('up','down')),
  snapshot_price  NUMERIC(19,4) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "predictions_read" ON predictions;
CREATE POLICY "predictions_read" ON predictions FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS prediction_bets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id   UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bet_direction   TEXT NOT NULL CHECK (bet_direction IN ('up','down')),
  amount          NUMERIC(19,4) NOT NULL,
  payout          NUMERIC(19,4),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','won','lost')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(prediction_id, user_id)
);
ALTER TABLE prediction_bets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bets_own" ON prediction_bets;
CREATE POLICY "bets_own" ON prediction_bets FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- ═══════════════════════════════════════════════════════════════════════════════
-- 9. CUSTOM THEMES
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS custom_themes (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  description_en  TEXT NOT NULL DEFAULT '',
  description_tr  TEXT NOT NULL DEFAULT '',
  price           NUMERIC(19,4) NOT NULL DEFAULT 0,
  css_vars        JSONB NOT NULL DEFAULT '{}',
  is_free         BOOLEAN NOT NULL DEFAULT false,
  sort_order      INT NOT NULL DEFAULT 0
);

INSERT INTO custom_themes (id, name, description_en, description_tr, price, css_vars, is_free, sort_order) VALUES
  ('default', 'Default', 'The classic TriangleBank look', 'Klasik TriangleBank görünümü', 0, '{}', true, 0),
  ('neon', 'Neon', 'Cyberpunk vibes with electric colors', 'Elektrik renkleriyle siberpunk havası', 500, '{"--primary":"280 100% 70%","--accent":"160 100% 50%","--card":"260 40% 8%","--background":"260 50% 4%"}', false, 1),
  ('ocean', 'Ocean', 'Deep sea calm with blue tones', 'Derin deniz mavisi tonları', 300, '{"--primary":"200 80% 55%","--accent":"170 70% 45%","--card":"210 30% 12%","--background":"210 35% 6%"}', false, 2),
  ('sunset', 'Sunset', 'Warm golden hour palette', 'Sıcak gün batımı paleti', 400, '{"--primary":"25 90% 55%","--accent":"340 80% 55%","--card":"15 25% 10%","--background":"15 30% 5%"}', false, 3),
  ('emerald', 'Emerald', 'Lush green finance aesthetic', 'Yeşil finans estetiği', 350, '{"--primary":"155 70% 45%","--accent":"120 60% 40%","--card":"160 25% 10%","--background":"160 30% 5%"}', false, 4),
  ('rose', 'Rose Gold', 'Elegant rose gold finish', 'Zarif rose gold dokunuş', 450, '{"--primary":"350 70% 60%","--accent":"320 60% 50%","--card":"340 20% 12%","--background":"340 25% 6%"}', false, 5)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_themes (
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  theme_id        TEXT NOT NULL REFERENCES custom_themes(id),
  purchased_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, theme_id)
);
ALTER TABLE user_themes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_themes_own" ON user_themes;
CREATE POLICY "user_themes_own" ON user_themes FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- Add active_theme to user_preferences
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS active_theme TEXT DEFAULT 'default';

-- ═══════════════════════════════════════════════════════════════════════════════
-- STORED PROCEDURES
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Credit Score Helper ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION ensure_credit_score()
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO credit_scores (user_id) VALUES (auth.uid())
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- ─── Take Loan ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION take_loan(p_amount NUMERIC, p_installments INT DEFAULT 5)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_score INT;
  v_max NUMERIC;
  v_rate NUMERIC;
  v_total NUMERIC;
  v_active_count INT;
  v_account_id UUID;
  v_tx_id UUID;
  v_ref TEXT;
  v_loan_id UUID;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_uid AND is_frozen) THEN
    RAISE EXCEPTION 'Account is frozen';
  END IF;
  IF p_amount < 100 OR p_amount > 50000 THEN
    RAISE EXCEPTION 'Loan amount must be between $100 and $50,000';
  END IF;
  IF p_installments < 1 OR p_installments > 10 THEN
    RAISE EXCEPTION 'Installments must be 1-10';
  END IF;

  PERFORM ensure_credit_score();
  SELECT score INTO v_score FROM credit_scores WHERE user_id = v_uid;
  SELECT COUNT(*) INTO v_active_count FROM loans WHERE user_id = v_uid AND status = 'active';
  IF v_active_count >= 3 THEN RAISE EXCEPTION 'Maximum 3 active loans'; END IF;

  v_max := CASE
    WHEN v_score >= 800 THEN 50000
    WHEN v_score >= 700 THEN 20000
    WHEN v_score >= 600 THEN 10000
    WHEN v_score >= 500 THEN 5000
    ELSE 1000
  END;
  IF p_amount > v_max THEN
    RAISE EXCEPTION 'Credit score too low for this amount (max $%)', v_max;
  END IF;

  v_rate := CASE
    WHEN v_score >= 800 THEN 0.03
    WHEN v_score >= 700 THEN 0.05
    WHEN v_score >= 600 THEN 0.08
    ELSE 0.12
  END;
  v_total := ROUND(p_amount * (1 + v_rate), 2);

  SELECT id INTO v_account_id FROM bank_accounts WHERE user_id = v_uid AND status = 'active' LIMIT 1;
  IF v_account_id IS NULL THEN RAISE EXCEPTION 'No active account'; END IF;

  INSERT INTO loans (user_id, principal, interest_rate, total_due, installments, due_at)
  VALUES (v_uid, p_amount, v_rate, v_total, p_installments, now() + interval '7 days')
  RETURNING id INTO v_loan_id;

  v_ref := 'LOAN-' || upper(substr(replace(gen_random_uuid()::TEXT,'-',''),1,10));
  INSERT INTO transactions (reference_id, type, status, amount, to_account_id, initiated_by, description, completed_at)
  VALUES (v_ref, 'loan_disbursement', 'completed', p_amount, v_account_id, v_uid, format('Loan disbursement · %s installments', p_installments), now())
  RETURNING id INTO v_tx_id;
  PERFORM apply_ledger_entry(v_tx_id, v_account_id, 'credit', p_amount);

  UPDATE credit_scores SET loans_taken = loans_taken + 1, updated_at = now() WHERE user_id = v_uid;

  INSERT INTO notifications (user_id, type, title, body, metadata)
  VALUES (v_uid, 'loan', 'Loan approved', format('$%s disbursed · repay $%s in %s installments', p_amount, v_total, p_installments),
    jsonb_build_object('loan_id', v_loan_id, 'amount', p_amount, 'total', v_total));

  RETURN jsonb_build_object('ok', true, 'loan_id', v_loan_id, 'amount', p_amount, 'total_due', v_total, 'rate', v_rate);
END;
$$;

-- ─── Repay Loan ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION repay_loan(p_loan_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_loan RECORD;
  v_installment NUMERIC;
  v_account_id UUID;
  v_balance NUMERIC;
  v_tx_id UUID;
  v_ref TEXT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_loan FROM loans WHERE id = p_loan_id AND user_id = v_uid AND status = 'active';
  IF NOT FOUND THEN RAISE EXCEPTION 'Loan not found'; END IF;

  v_installment := ROUND((v_loan.total_due - v_loan.amount_paid) / GREATEST(v_loan.installments - v_loan.paid_count, 1), 2);

  SELECT id, balance INTO v_account_id, v_balance FROM bank_accounts WHERE user_id = v_uid AND status = 'active' LIMIT 1;
  IF v_balance < v_installment THEN RAISE EXCEPTION 'Insufficient balance for repayment ($%)', v_installment; END IF;

  v_ref := 'REPAY-' || upper(substr(replace(gen_random_uuid()::TEXT,'-',''),1,10));
  INSERT INTO transactions (reference_id, type, status, amount, from_account_id, initiated_by, description, completed_at)
  VALUES (v_ref, 'loan_repayment', 'completed', v_installment, v_account_id, v_uid, format('Loan repayment · installment %s/%s', v_loan.paid_count+1, v_loan.installments), now())
  RETURNING id INTO v_tx_id;
  PERFORM apply_ledger_entry(v_tx_id, v_account_id, 'debit', v_installment);

  UPDATE loans SET
    amount_paid = amount_paid + v_installment,
    paid_count = paid_count + 1,
    status = CASE WHEN paid_count + 1 >= installments THEN 'paid' ELSE 'active' END,
    updated_at = now()
  WHERE id = p_loan_id;

  IF v_loan.paid_count + 1 >= v_loan.installments THEN
    UPDATE credit_scores SET
      score = LEAST(score + 15, 850),
      loans_repaid = loans_repaid + 1,
      updated_at = now()
    WHERE user_id = v_uid;
  END IF;

  INSERT INTO notifications (user_id, type, title, body, metadata)
  VALUES (v_uid, 'loan', 'Loan payment', format('$%s paid · %s/%s', v_installment, v_loan.paid_count+1, v_loan.installments),
    jsonb_build_object('loan_id', p_loan_id, 'amount', v_installment));

  RETURN jsonb_build_object('ok', true, 'paid', v_installment, 'remaining', GREATEST(v_loan.total_due - v_loan.amount_paid - v_installment, 0));
END;
$$;

-- ─── Create Term Deposit ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_term_deposit(p_amount NUMERIC, p_term_days INT DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_account_id UUID;
  v_balance NUMERIC;
  v_rate NUMERIC;
  v_maturity NUMERIC;
  v_deposit_id UUID;
  v_tx_id UUID;
  v_ref TEXT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount < 100 THEN RAISE EXCEPTION 'Minimum deposit is $100'; END IF;
  IF p_term_days NOT IN (7, 14, 30, 60, 90) THEN RAISE EXCEPTION 'Term must be 7, 14, 30, 60 or 90 days'; END IF;

  SELECT id, balance INTO v_account_id, v_balance FROM bank_accounts WHERE user_id = v_uid AND status = 'active' LIMIT 1;
  IF v_balance < p_amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  v_rate := CASE p_term_days
    WHEN 7 THEN 0.01
    WHEN 14 THEN 0.025
    WHEN 30 THEN 0.05
    WHEN 60 THEN 0.08
    WHEN 90 THEN 0.12
  END;
  v_maturity := ROUND(p_amount * (1 + v_rate), 2);

  INSERT INTO term_deposits (user_id, amount, interest_rate, term_days, maturity_amount, matures_at)
  VALUES (v_uid, p_amount, v_rate, p_term_days, v_maturity, now() + make_interval(days => p_term_days))
  RETURNING id INTO v_deposit_id;

  v_ref := 'DEP-' || upper(substr(replace(gen_random_uuid()::TEXT,'-',''),1,10));
  INSERT INTO transactions (reference_id, type, status, amount, from_account_id, initiated_by, description, completed_at)
  VALUES (v_ref, 'deposit_lock', 'completed', p_amount, v_account_id, v_uid, format('Term deposit · %s days · %s%% APR', p_term_days, (v_rate*100)::INT), now())
  RETURNING id INTO v_tx_id;
  PERFORM apply_ledger_entry(v_tx_id, v_account_id, 'debit', p_amount);

  INSERT INTO notifications (user_id, type, title, body, metadata)
  VALUES (v_uid, 'deposit_matured', 'Deposit created', format('$%s locked for %s days · earns $%s', p_amount, p_term_days, ROUND(v_maturity - p_amount, 2)),
    jsonb_build_object('deposit_id', v_deposit_id));

  RETURN jsonb_build_object('ok', true, 'deposit_id', v_deposit_id, 'maturity_amount', v_maturity, 'rate', v_rate);
END;
$$;

-- ─── Withdraw Term Deposit ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION withdraw_term_deposit(p_deposit_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_dep RECORD;
  v_payout NUMERIC;
  v_account_id UUID;
  v_tx_id UUID;
  v_ref TEXT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_dep FROM term_deposits WHERE id = p_deposit_id AND user_id = v_uid AND status = 'active';
  IF NOT FOUND THEN RAISE EXCEPTION 'Deposit not found'; END IF;

  IF v_dep.matures_at > now() THEN
    v_payout := v_dep.amount;
  ELSE
    v_payout := v_dep.maturity_amount;
  END IF;

  UPDATE term_deposits SET status = CASE WHEN matures_at <= now() THEN 'matured' ELSE 'withdrawn' END WHERE id = p_deposit_id;

  SELECT id INTO v_account_id FROM bank_accounts WHERE user_id = v_uid AND status = 'active' LIMIT 1;
  v_ref := 'DEPW-' || upper(substr(replace(gen_random_uuid()::TEXT,'-',''),1,10));
  INSERT INTO transactions (reference_id, type, status, amount, to_account_id, initiated_by, description, completed_at)
  VALUES (v_ref, 'deposit_unlock', 'completed', v_payout, v_account_id, v_uid, format('Deposit withdrawal · $%s', v_payout), now())
  RETURNING id INTO v_tx_id;
  PERFORM apply_ledger_entry(v_tx_id, v_account_id, 'credit', v_payout);

  INSERT INTO notifications (user_id, type, title, body, metadata)
  VALUES (v_uid, 'deposit_matured', 'Deposit withdrawn', format('$%s returned to your account', v_payout),
    jsonb_build_object('deposit_id', p_deposit_id, 'payout', v_payout));

  RETURN jsonb_build_object('ok', true, 'payout', v_payout, 'early', v_dep.matures_at > now());
END;
$$;

-- ─── Tick Forex Rates ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION tick_forex_rates()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r RECORD;
  v_new NUMERIC;
  v_count INT := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  FOR r IN SELECT * FROM forex_pairs LOOP
    v_new := ROUND(r.rate * (1 + (random() - 0.5) * 0.006), 6);
    IF v_new < 0.001 THEN v_new := 0.001; END IF;
    UPDATE forex_pairs SET prev_rate = rate, rate = v_new, updated_at = now() WHERE pair = r.pair;
    v_count := v_count + 1;
  END LOOP;
  RETURN jsonb_build_object('ticked', v_count);
END;
$$;

-- ─── Buy Forex ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION buy_forex(p_pair TEXT, p_usd_amount NUMERIC)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_account_id UUID;
  v_balance NUMERIC;
  v_pair RECORD;
  v_bought NUMERIC;
  v_tx_id UUID;
  v_ref TEXT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_usd_amount < 10 THEN RAISE EXCEPTION 'Minimum $10'; END IF;

  SELECT * INTO v_pair FROM forex_pairs WHERE pair = p_pair;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pair not found'; END IF;

  SELECT id, balance INTO v_account_id, v_balance FROM bank_accounts WHERE user_id = v_uid AND status = 'active' LIMIT 1;
  IF v_balance < p_usd_amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  v_bought := ROUND(p_usd_amount * v_pair.rate, 4);

  v_ref := 'FX-' || upper(substr(replace(gen_random_uuid()::TEXT,'-',''),1,10));
  INSERT INTO transactions (reference_id, type, status, amount, from_account_id, initiated_by, description, completed_at)
  VALUES (v_ref, 'forex_trade', 'completed', p_usd_amount, v_account_id, v_uid, format('Buy %s · %s %s', p_pair, v_bought, v_pair.quote_currency), now())
  RETURNING id INTO v_tx_id;
  PERFORM apply_ledger_entry(v_tx_id, v_account_id, 'debit', p_usd_amount);

  INSERT INTO forex_holdings (user_id, currency, amount)
  VALUES (v_uid, v_pair.quote_currency, v_bought)
  ON CONFLICT (user_id, currency) DO UPDATE SET amount = forex_holdings.amount + v_bought;

  RETURN jsonb_build_object('ok', true, 'bought', v_bought, 'currency', v_pair.quote_currency, 'rate', v_pair.rate);
END;
$$;

-- ─── Sell Forex ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sell_forex(p_pair TEXT, p_currency_amount NUMERIC)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_account_id UUID;
  v_pair RECORD;
  v_holding NUMERIC;
  v_usd NUMERIC;
  v_tx_id UUID;
  v_ref TEXT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_pair FROM forex_pairs WHERE pair = p_pair;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pair not found'; END IF;

  SELECT amount INTO v_holding FROM forex_holdings WHERE user_id = v_uid AND currency = v_pair.quote_currency;
  IF COALESCE(v_holding, 0) < p_currency_amount THEN RAISE EXCEPTION 'Insufficient holdings'; END IF;

  v_usd := ROUND(p_currency_amount / v_pair.rate, 2);

  UPDATE forex_holdings SET amount = amount - p_currency_amount WHERE user_id = v_uid AND currency = v_pair.quote_currency;
  DELETE FROM forex_holdings WHERE user_id = v_uid AND currency = v_pair.quote_currency AND amount <= 0;

  SELECT id INTO v_account_id FROM bank_accounts WHERE user_id = v_uid AND status = 'active' LIMIT 1;
  v_ref := 'FXS-' || upper(substr(replace(gen_random_uuid()::TEXT,'-',''),1,10));
  INSERT INTO transactions (reference_id, type, status, amount, to_account_id, initiated_by, description, completed_at)
  VALUES (v_ref, 'forex_trade', 'completed', v_usd, v_account_id, v_uid, format('Sell %s · %s USD', p_pair, v_usd), now())
  RETURNING id INTO v_tx_id;
  PERFORM apply_ledger_entry(v_tx_id, v_account_id, 'credit', v_usd);

  RETURN jsonb_build_object('ok', true, 'usd_received', v_usd, 'sold', p_currency_amount, 'currency', v_pair.quote_currency);
END;
$$;

-- ─── Tick Crypto Prices ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION tick_crypto_prices()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r RECORD;
  v_new NUMERIC;
  v_count INT := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  FOR r IN SELECT * FROM crypto_assets WHERE is_active LOOP
    v_new := ROUND(r.price * (1 + (random() - 0.5) * r.volatility * 2), 4);
    IF v_new < 0.01 THEN v_new := 0.01; END IF;
    UPDATE crypto_assets SET prev_price = price, price = v_new, updated_at = now() WHERE symbol = r.symbol;
    v_count := v_count + 1;
  END LOOP;
  RETURN jsonb_build_object('ticked', v_count);
END;
$$;

-- ─── Buy Crypto ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION buy_crypto(p_symbol TEXT, p_usd_amount NUMERIC)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_account_id UUID;
  v_balance NUMERIC;
  v_asset RECORD;
  v_qty NUMERIC;
  v_tx_id UUID;
  v_ref TEXT;
  v_old_qty NUMERIC;
  v_old_cost NUMERIC;
  v_new_avg NUMERIC;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_usd_amount < 1 THEN RAISE EXCEPTION 'Minimum $1'; END IF;

  SELECT * INTO v_asset FROM crypto_assets WHERE symbol = p_symbol AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Asset not found'; END IF;

  SELECT id, balance INTO v_account_id, v_balance FROM bank_accounts WHERE user_id = v_uid AND status = 'active' LIMIT 1;
  IF v_balance < p_usd_amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  v_qty := ROUND(p_usd_amount / v_asset.price, 8);

  v_ref := 'CRYPTO-' || upper(substr(replace(gen_random_uuid()::TEXT,'-',''),1,10));
  INSERT INTO transactions (reference_id, type, status, amount, from_account_id, initiated_by, description, completed_at)
  VALUES (v_ref, 'crypto_trade', 'completed', p_usd_amount, v_account_id, v_uid, format('Buy %s %s @ $%s', v_qty, p_symbol, v_asset.price), now())
  RETURNING id INTO v_tx_id;
  PERFORM apply_ledger_entry(v_tx_id, v_account_id, 'debit', p_usd_amount);

  SELECT quantity, average_cost INTO v_old_qty, v_old_cost FROM crypto_holdings WHERE user_id = v_uid AND symbol = p_symbol;
  v_old_qty := COALESCE(v_old_qty, 0);
  v_old_cost := COALESCE(v_old_cost, 0);
  v_new_avg := CASE WHEN v_old_qty + v_qty > 0 THEN ROUND((v_old_qty * v_old_cost + p_usd_amount) / (v_old_qty + v_qty), 4) ELSE v_asset.price END;

  INSERT INTO crypto_holdings (user_id, symbol, quantity, average_cost)
  VALUES (v_uid, p_symbol, v_qty, v_asset.price)
  ON CONFLICT (user_id, symbol) DO UPDATE SET
    quantity = crypto_holdings.quantity + v_qty,
    average_cost = v_new_avg;

  RETURN jsonb_build_object('ok', true, 'quantity', v_qty, 'price', v_asset.price, 'total', p_usd_amount);
END;
$$;

-- ─── Sell Crypto ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sell_crypto(p_symbol TEXT, p_quantity NUMERIC)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_account_id UUID;
  v_asset RECORD;
  v_holding NUMERIC;
  v_usd NUMERIC;
  v_tx_id UUID;
  v_ref TEXT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_asset FROM crypto_assets WHERE symbol = p_symbol AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Asset not found'; END IF;

  SELECT quantity INTO v_holding FROM crypto_holdings WHERE user_id = v_uid AND symbol = p_symbol;
  IF COALESCE(v_holding, 0) < p_quantity THEN RAISE EXCEPTION 'Insufficient holdings'; END IF;

  v_usd := ROUND(p_quantity * v_asset.price, 2);

  UPDATE crypto_holdings SET quantity = quantity - p_quantity WHERE user_id = v_uid AND symbol = p_symbol;
  DELETE FROM crypto_holdings WHERE user_id = v_uid AND symbol = p_symbol AND quantity <= 0;

  SELECT id INTO v_account_id FROM bank_accounts WHERE user_id = v_uid AND status = 'active' LIMIT 1;
  v_ref := 'CRSELL-' || upper(substr(replace(gen_random_uuid()::TEXT,'-',''),1,10));
  INSERT INTO transactions (reference_id, type, status, amount, to_account_id, initiated_by, description, completed_at)
  VALUES (v_ref, 'crypto_trade', 'completed', v_usd, v_account_id, v_uid, format('Sell %s %s @ $%s', p_quantity, p_symbol, v_asset.price), now())
  RETURNING id INTO v_tx_id;
  PERFORM apply_ledger_entry(v_tx_id, v_account_id, 'credit', v_usd);

  RETURN jsonb_build_object('ok', true, 'usd_received', v_usd, 'quantity', p_quantity, 'price', v_asset.price);
END;
$$;

-- ─── Buy Insurance ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION buy_insurance(p_type TEXT, p_coverage NUMERIC)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_account_id UUID;
  v_balance NUMERIC;
  v_premium NUMERIC;
  v_policy_id UUID;
  v_tx_id UUID;
  v_ref TEXT;
  v_active_count INT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_type NOT IN ('account','stock','crypto') THEN RAISE EXCEPTION 'Invalid policy type'; END IF;
  IF p_coverage < 500 THEN RAISE EXCEPTION 'Minimum coverage $500'; END IF;

  SELECT COUNT(*) INTO v_active_count FROM insurance_policies WHERE user_id = v_uid AND status = 'active' AND policy_type = p_type;
  IF v_active_count >= 1 THEN RAISE EXCEPTION 'Already have active %s insurance', p_type; END IF;

  v_premium := ROUND(p_coverage * 0.05, 2);

  SELECT id, balance INTO v_account_id, v_balance FROM bank_accounts WHERE user_id = v_uid AND status = 'active' LIMIT 1;
  IF v_balance < v_premium THEN RAISE EXCEPTION 'Need $% for premium', v_premium; END IF;

  INSERT INTO insurance_policies (user_id, policy_type, coverage_amount, premium, expires_at)
  VALUES (v_uid, p_type, p_coverage, v_premium, now() + interval '30 days')
  RETURNING id INTO v_policy_id;

  v_ref := 'INS-' || upper(substr(replace(gen_random_uuid()::TEXT,'-',''),1,10));
  INSERT INTO transactions (reference_id, type, status, amount, from_account_id, initiated_by, description, completed_at)
  VALUES (v_ref, 'insurance_premium', 'completed', v_premium, v_account_id, v_uid, format('%s insurance · $%s coverage', p_type, p_coverage), now())
  RETURNING id INTO v_tx_id;
  PERFORM apply_ledger_entry(v_tx_id, v_account_id, 'debit', v_premium);

  INSERT INTO notifications (user_id, type, title, body, metadata)
  VALUES (v_uid, 'system', 'Insurance active', format('%s insurance · $%s coverage for 30 days', initcap(p_type), p_coverage),
    jsonb_build_object('policy_id', v_policy_id));

  RETURN jsonb_build_object('ok', true, 'policy_id', v_policy_id, 'premium', v_premium, 'coverage', p_coverage);
END;
$$;

-- ─── Send Chat ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION send_chat_message(p_content TEXT, p_receiver_id UUID DEFAULT NULL, p_channel TEXT DEFAULT 'general')
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_msg_id UUID;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF char_length(p_content) < 1 OR char_length(p_content) > 500 THEN
    RAISE EXCEPTION 'Message must be 1-500 characters';
  END IF;

  INSERT INTO chat_messages (sender_id, receiver_id, channel, content)
  VALUES (v_uid, p_receiver_id, COALESCE(p_channel, 'general'), p_content)
  RETURNING id INTO v_msg_id;

  RETURN jsonb_build_object('ok', true, 'id', v_msg_id);
END;
$$;

-- ─── Place Prediction Bet ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION place_prediction_bet(p_prediction_id UUID, p_direction TEXT, p_amount NUMERIC)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_pred RECORD;
  v_account_id UUID;
  v_balance NUMERIC;
  v_tx_id UUID;
  v_ref TEXT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_direction NOT IN ('up','down') THEN RAISE EXCEPTION 'Direction must be up or down'; END IF;
  IF p_amount < 10 OR p_amount > 5000 THEN RAISE EXCEPTION 'Bet must be $10-$5000'; END IF;

  SELECT * INTO v_pred FROM predictions WHERE id = p_prediction_id AND NOT resolved AND resolves_at > now();
  IF NOT FOUND THEN RAISE EXCEPTION 'Prediction not available'; END IF;

  IF EXISTS (SELECT 1 FROM prediction_bets WHERE prediction_id = p_prediction_id AND user_id = v_uid) THEN
    RAISE EXCEPTION 'Already placed a bet on this prediction';
  END IF;

  SELECT id, balance INTO v_account_id, v_balance FROM bank_accounts WHERE user_id = v_uid AND status = 'active' LIMIT 1;
  IF v_balance < p_amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  v_ref := 'BET-' || upper(substr(replace(gen_random_uuid()::TEXT,'-',''),1,10));
  INSERT INTO transactions (reference_id, type, status, amount, from_account_id, initiated_by, description, completed_at)
  VALUES (v_ref, 'prediction_bet', 'completed', p_amount, v_account_id, v_uid,
    format('Prediction bet · %s %s', v_pred.symbol, p_direction), now())
  RETURNING id INTO v_tx_id;
  PERFORM apply_ledger_entry(v_tx_id, v_account_id, 'debit', p_amount);

  INSERT INTO prediction_bets (prediction_id, user_id, bet_direction, amount)
  VALUES (p_prediction_id, v_uid, p_direction, p_amount);

  RETURN jsonb_build_object('ok', true, 'prediction_id', p_prediction_id, 'direction', p_direction, 'amount', p_amount);
END;
$$;

-- ─── Resolve Prediction ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION resolve_predictions()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_pred RECORD;
  v_current_price NUMERIC;
  v_outcome TEXT;
  v_bet RECORD;
  v_payout NUMERIC;
  v_account_id UUID;
  v_tx_id UUID;
  v_ref TEXT;
  v_count INT := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  FOR v_pred IN SELECT * FROM predictions WHERE NOT resolved AND resolves_at <= now() LOOP
    SELECT price INTO v_current_price FROM stock_prices WHERE symbol = v_pred.symbol ORDER BY recorded_at DESC LIMIT 1;
    IF v_current_price IS NULL THEN CONTINUE; END IF;

    v_outcome := CASE WHEN v_current_price >= v_pred.snapshot_price THEN 'up' ELSE 'down' END;
    UPDATE predictions SET resolved = true, outcome = v_outcome WHERE id = v_pred.id;

    FOR v_bet IN SELECT * FROM prediction_bets WHERE prediction_id = v_pred.id AND status = 'pending' LOOP
      IF v_bet.bet_direction = v_outcome THEN
        v_payout := ROUND(v_bet.amount * 1.85, 2);
        UPDATE prediction_bets SET status = 'won', payout = v_payout WHERE id = v_bet.id;

        SELECT id INTO v_account_id FROM bank_accounts WHERE user_id = v_bet.user_id AND status = 'active' LIMIT 1;
        v_ref := 'PWIN-' || upper(substr(replace(gen_random_uuid()::TEXT,'-',''),1,10));
        INSERT INTO transactions (reference_id, type, status, amount, to_account_id, initiated_by, description, completed_at)
        VALUES (v_ref, 'prediction_win', 'completed', v_payout, v_account_id, v_bet.user_id,
          format('Prediction win · %s went %s', v_pred.symbol, v_outcome), now())
        RETURNING id INTO v_tx_id;
        PERFORM apply_ledger_entry(v_tx_id, v_account_id, 'credit', v_payout);

        INSERT INTO notifications (user_id, type, title, body, metadata)
        VALUES (v_bet.user_id, 'prediction', 'Prediction won!', format('+$%s · %s went %s', v_payout, v_pred.symbol, v_outcome),
          jsonb_build_object('payout', v_payout));
      ELSE
        UPDATE prediction_bets SET status = 'lost', payout = 0 WHERE id = v_bet.id;
        INSERT INTO notifications (user_id, type, title, body, metadata)
        VALUES (v_bet.user_id, 'prediction', 'Prediction lost', format('%s went %s · $%s lost', v_pred.symbol, v_outcome, v_bet.amount),
          jsonb_build_object('lost', v_bet.amount));
      END IF;
    END LOOP;
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('resolved', v_count);
END;
$$;

-- ─── Spawn Prediction ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION spawn_prediction()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_symbol TEXT;
  v_price NUMERIC;
  v_direction TEXT;
  v_pred_id UUID;
  v_question_en TEXT;
  v_question_tr TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  IF EXISTS (SELECT 1 FROM predictions WHERE NOT resolved AND resolves_at > now()) THEN
    RETURN jsonb_build_object('spawned', false, 'reason', 'active_prediction_exists');
  END IF;

  SELECT s.symbol INTO v_symbol FROM stock_symbols s WHERE s.is_active ORDER BY random() LIMIT 1;
  SELECT price INTO v_price FROM stock_prices WHERE symbol = v_symbol ORDER BY recorded_at DESC LIMIT 1;
  IF v_price IS NULL THEN v_price := 100; END IF;

  v_direction := CASE WHEN random() < 0.5 THEN 'up' ELSE 'down' END;
  v_question_en := format('Will %s go UP or DOWN in the next 5 minutes?', v_symbol);
  v_question_tr := format('%s önümüzdeki 5 dakikada YÜKSELİR mi DÜŞER mi?', v_symbol);

  INSERT INTO predictions (symbol, question_en, question_tr, direction, snapshot_price, resolves_at)
  VALUES (v_symbol, v_question_en, v_question_tr, v_direction, v_price, now() + interval '5 minutes')
  RETURNING id INTO v_pred_id;

  RETURN jsonb_build_object('spawned', true, 'id', v_pred_id, 'symbol', v_symbol, 'price', v_price);
END;
$$;

-- ─── Buy Theme ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION buy_theme(p_theme_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_theme RECORD;
  v_account_id UUID;
  v_balance NUMERIC;
  v_tx_id UUID;
  v_ref TEXT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_theme FROM custom_themes WHERE id = p_theme_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Theme not found'; END IF;

  IF v_theme.is_free OR EXISTS (SELECT 1 FROM user_themes WHERE user_id = v_uid AND theme_id = p_theme_id) THEN
    PERFORM ensure_user_preferences();
    UPDATE user_preferences SET active_theme = p_theme_id WHERE user_id = v_uid;
    RETURN jsonb_build_object('ok', true, 'activated', true, 'purchased', false);
  END IF;

  SELECT id, balance INTO v_account_id, v_balance FROM bank_accounts WHERE user_id = v_uid AND status = 'active' LIMIT 1;
  IF v_balance < v_theme.price THEN RAISE EXCEPTION 'Insufficient balance · need $%', v_theme.price; END IF;

  v_ref := 'THEME-' || upper(substr(replace(gen_random_uuid()::TEXT,'-',''),1,10));
  INSERT INTO transactions (reference_id, type, status, amount, from_account_id, initiated_by, description, completed_at)
  VALUES (v_ref, 'theme_purchase', 'completed', v_theme.price, v_account_id, v_uid, format('Theme · %s', v_theme.name), now())
  RETURNING id INTO v_tx_id;
  PERFORM apply_ledger_entry(v_tx_id, v_account_id, 'debit', v_theme.price);

  INSERT INTO user_themes (user_id, theme_id) VALUES (v_uid, p_theme_id);

  PERFORM ensure_user_preferences();
  UPDATE user_preferences SET active_theme = p_theme_id WHERE user_id = v_uid;

  RETURN jsonb_build_object('ok', true, 'activated', true, 'purchased', true, 'price', v_theme.price);
END;
$$;

-- ─── Claim Battle Pass Reward ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION claim_season_mission(p_mission_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_progress RECORD;
  v_mission RECORD;
  v_account_id UUID;
  v_tx_id UUID;
  v_ref TEXT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_progress FROM user_season_progress WHERE user_id = v_uid AND mission_id = p_mission_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Mission progress not found'; END IF;
  IF NOT v_progress.completed THEN RAISE EXCEPTION 'Mission not completed yet'; END IF;
  IF v_progress.claimed THEN RAISE EXCEPTION 'Already claimed'; END IF;

  SELECT * INTO v_mission FROM season_missions WHERE id = p_mission_id;

  UPDATE user_season_progress SET claimed = true WHERE user_id = v_uid AND mission_id = p_mission_id;

  UPDATE user_season_xp SET
    total_xp = total_xp + v_mission.xp_reward,
    level = 1 + (total_xp + v_mission.xp_reward) / 500
  WHERE user_id = v_uid AND season_id = v_mission.season_id;

  IF v_mission.cash_reward > 0 THEN
    SELECT id INTO v_account_id FROM bank_accounts WHERE user_id = v_uid AND status = 'active' LIMIT 1;
    v_ref := 'BP-' || upper(substr(replace(gen_random_uuid()::TEXT,'-',''),1,10));
    INSERT INTO transactions (reference_id, type, status, amount, to_account_id, initiated_by, description, completed_at)
    VALUES (v_ref, 'battle_pass_reward', 'completed', v_mission.cash_reward, v_account_id, v_uid,
      format('Season mission reward · %s XP', v_mission.xp_reward), now())
    RETURNING id INTO v_tx_id;
    PERFORM apply_ledger_entry(v_tx_id, v_account_id, 'credit', v_mission.cash_reward);
  END IF;

  INSERT INTO notifications (user_id, type, title, body, metadata)
  VALUES (v_uid, 'battle_pass', 'Mission complete', format('+%s XP · $%s', v_mission.xp_reward, v_mission.cash_reward),
    jsonb_build_object('xp', v_mission.xp_reward, 'cash', v_mission.cash_reward));

  RETURN jsonb_build_object('ok', true, 'xp', v_mission.xp_reward, 'cash', v_mission.cash_reward);
END;
$$;

-- ─── Seed initial season ────────────────────────────────────────────────────
INSERT INTO seasons (name, starts_at, ends_at, is_active)
SELECT 'Season 1 — Genesis', now(), now() + interval '30 days', true
WHERE NOT EXISTS (SELECT 1 FROM seasons WHERE is_active);

INSERT INTO season_missions (season_id, title_en, title_tr, description_en, description_tr, mission_type, target_value, xp_reward, cash_reward, sort_order)
SELECT s.id, m.title_en, m.title_tr, m.desc_en, m.desc_tr, m.mtype, m.target, m.xp, m.cash, m.ord
FROM seasons s,
(VALUES
  ('Make 5 transfers', '5 transfer yap', 'Send money to other players', 'Diğer oyunculara para gönder', 'transfer_count', 5, 200, 100, 1),
  ('Buy 3 stocks', '3 hisse al', 'Purchase stocks from the market', 'Piyasadan hisse al', 'stock_buy_count', 3, 150, 75, 2),
  ('Earn $500', '500$ kazan', 'Earn through any income source', 'Herhangi bir gelir kaynağından kazan', 'earn_total', 500, 300, 150, 3),
  ('Buy 2 shop items', '2 mağaza ürünü al', 'Purchase items from the shop', 'Mağazadan ürün al', 'shop_buy_count', 2, 100, 50, 4),
  ('Win a prediction', 'Tahmin kazan', 'Win a market prediction bet', 'Piyasa tahmini kazan', 'prediction_win', 1, 250, 125, 5),
  ('Trade forex', 'Döviz al-sat', 'Make a forex trade', 'Bir döviz işlemi yap', 'forex_trade', 1, 100, 50, 6),
  ('Buy crypto', 'Kripto al', 'Purchase any cryptocurrency', 'Herhangi bir kripto para al', 'crypto_buy', 1, 100, 50, 7),
  ('Claim 7-day streak', '7 günlük seri', 'Maintain a 7-day login streak', '7 günlük giriş serisini koru', 'streak_7', 1, 500, 250, 8)
) AS m(title_en, title_tr, desc_en, desc_tr, mtype, target, xp, cash, ord)
WHERE s.is_active
AND NOT EXISTS (SELECT 1 FROM season_missions WHERE season_id = s.id);

-- ─── Grants ──────────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION ensure_credit_score() TO authenticated;
GRANT EXECUTE ON FUNCTION take_loan(NUMERIC, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION repay_loan(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_term_deposit(NUMERIC, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION withdraw_term_deposit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION tick_forex_rates() TO authenticated;
GRANT EXECUTE ON FUNCTION buy_forex(TEXT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION sell_forex(TEXT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION tick_crypto_prices() TO authenticated;
GRANT EXECUTE ON FUNCTION buy_crypto(TEXT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION sell_crypto(TEXT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION buy_insurance(TEXT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION send_chat_message(TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION place_prediction_bet(UUID, TEXT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION resolve_predictions() TO authenticated;
GRANT EXECUTE ON FUNCTION spawn_prediction() TO authenticated;
GRANT EXECUTE ON FUNCTION buy_theme(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION claim_season_mission(UUID) TO authenticated;

GRANT SELECT ON forex_pairs TO authenticated;
GRANT SELECT ON crypto_assets TO authenticated;
GRANT SELECT ON custom_themes TO authenticated;
GRANT SELECT ON seasons TO authenticated;
GRANT SELECT ON season_missions TO authenticated;
GRANT SELECT ON predictions TO authenticated;
