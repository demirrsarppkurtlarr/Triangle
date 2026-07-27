-- TriangleBank Phase 2: Helper Functions and Triggers

-- ─────────────────────────────────────────────
-- updated_at trigger
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER trg_bank_accounts_updated_at
  BEFORE UPDATE ON bank_accounts
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER trg_stock_symbols_updated_at
  BEFORE UPDATE ON stock_symbols
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER trg_portfolios_updated_at
  BEFORE UPDATE ON portfolios
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- ─────────────────────────────────────────────
-- Triangle ID generator
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_triangle_id()
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_id := 'TR-'
      || lpad((floor(random() * 10000))::INT::TEXT, 4, '0') || '-'
      || lpad((floor(random() * 10000))::INT::TEXT, 4, '0') || '-'
      || lpad((floor(random() * 10000))::INT::TEXT, 4, '0');

    SELECT EXISTS(SELECT 1 FROM profiles WHERE triangle_id = v_id) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;

  RETURN v_id;
END;
$$;

-- ─────────────────────────────────────────────
-- Account number generator
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_account_number()
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_num TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_num := 'AC-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 12));
    SELECT EXISTS(SELECT 1 FROM bank_accounts WHERE account_number = v_num) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;

  RETURN v_num;
END;
$$;

-- ─────────────────────────────────────────────
-- Admin check (server-side only, never trust frontend)
-- Only username 'demirsarpk' with is_admin flag
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND username = 'demirsarpk'
      AND is_admin = true
      AND is_frozen = false
  );
$$;

-- ─────────────────────────────────────────────
-- Check if current user owns account
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION owns_account(p_account_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM bank_accounts
    WHERE id = p_account_id
      AND user_id = auth.uid()
  );
$$;

-- ─────────────────────────────────────────────
-- Get account by triangle_id
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_account_by_triangle_id(p_triangle_id TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ba.id
  FROM bank_accounts ba
  JOIN profiles p ON p.id = ba.user_id
  WHERE p.triangle_id = p_triangle_id
    AND p.is_frozen = false
    AND ba.status = 'active';
$$;

-- ─────────────────────────────────────────────
-- Prevent direct balance manipulation
-- Balance can only change via SECURITY DEFINER functions
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION prevent_direct_balance_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.balance IS DISTINCT FROM NEW.balance THEN
    IF current_setting('trianglebank.balance_update', true) IS DISTINCT FROM 'allowed' THEN
      RAISE EXCEPTION 'Direct balance updates are not permitted';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_direct_balance_update
  BEFORE UPDATE ON bank_accounts
  FOR EACH ROW EXECUTE PROCEDURE prevent_direct_balance_update();

-- ─────────────────────────────────────────────
-- New user handler (profile + bank account)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username TEXT;
  v_is_admin BOOLEAN;
BEGIN
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );

  -- Admin role assigned ONLY when username matches demirsarpk
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
  VALUES (NEW.id, generate_account_number());

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- ─────────────────────────────────────────────
-- Audit log helper
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_audit_log(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (auth.uid(), p_action, p_resource_type, p_resource_id, p_metadata)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- ─────────────────────────────────────────────
-- Internal: apply ledger entry and update balance
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION apply_ledger_entry(
  p_transaction_id UUID,
  p_account_id UUID,
  p_entry_type ledger_entry_type,
  p_amount NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  -- Lock the account row
  SELECT balance INTO v_current_balance
  FROM bank_accounts
  WHERE id = p_account_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found: %', p_account_id;
  END IF;

  IF p_entry_type = 'debit' THEN
    v_new_balance := v_current_balance - p_amount;
    IF v_new_balance < 0 THEN
      RAISE EXCEPTION 'Insufficient funds';
    END IF;
  ELSE
    v_new_balance := v_current_balance + p_amount;
  END IF;

  PERFORM set_config('trianglebank.balance_update', 'allowed', true);

  UPDATE bank_accounts
  SET balance = v_new_balance
  WHERE id = p_account_id;

  PERFORM set_config('trianglebank.balance_update', '', true);

  INSERT INTO ledger_entries (transaction_id, account_id, entry_type, amount, balance_after)
  VALUES (p_transaction_id, p_account_id, p_entry_type, p_amount, v_new_balance);

  RETURN v_new_balance;
END;
$$;
