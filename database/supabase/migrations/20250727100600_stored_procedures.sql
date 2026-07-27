-- TriangleBank Phase 2: Stored Procedures (Transfers & Admin)

-- ─────────────────────────────────────────────
-- Transfer funds between accounts
-- Called via: supabase.rpc('transfer_funds', {...})
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION transfer_funds(
  p_to_triangle_id TEXT,
  p_amount NUMERIC,
  p_description TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id UUID;
  v_sender_account_id UUID;
  v_receiver_account_id UUID;
  v_receiver_user_id UUID;
  v_transaction_id UUID;
  v_reference_id TEXT;
  v_existing_tx UUID;
  v_sender_frozen BOOLEAN;
  v_daily_total NUMERIC;
  v_daily_limit NUMERIC;
  v_single_limit NUMERIC;
BEGIN
  v_sender_id := auth.uid();

  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Idempotency check
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing_tx
    FROM transactions
    WHERE idempotency_key = p_idempotency_key;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_existing_tx,
        'duplicate', true
      );
    END IF;
  END IF;

  -- Check sender frozen
  SELECT is_frozen INTO v_sender_frozen
  FROM profiles WHERE id = v_sender_id;

  IF v_sender_frozen THEN
    RAISE EXCEPTION 'Your account is frozen';
  END IF;

  -- Get limits from settings
  SELECT (value->>'amount')::NUMERIC INTO v_daily_limit
  FROM settings WHERE key = 'transfer_daily_limit';

  SELECT (value->>'amount')::NUMERIC INTO v_single_limit
  FROM settings WHERE key = 'transfer_single_limit';

  IF p_amount > COALESCE(v_single_limit, 5000) THEN
    RAISE EXCEPTION 'Amount exceeds single transfer limit';
  END IF;

  -- Daily limit check
  SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
  FROM transactions
  WHERE initiated_by = v_sender_id
    AND type = 'transfer'
    AND status = 'completed'
    AND created_at >= date_trunc('day', now());

  IF v_daily_total + p_amount > COALESCE(v_daily_limit, 10000) THEN
    RAISE EXCEPTION 'Daily transfer limit exceeded';
  END IF;

  -- Get sender account
  SELECT id INTO v_sender_account_id
  FROM bank_accounts
  WHERE user_id = v_sender_id AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sender account not found';
  END IF;

  -- Get receiver account
  SELECT ba.id, ba.user_id INTO v_receiver_account_id, v_receiver_user_id
  FROM bank_accounts ba
  JOIN profiles p ON p.id = ba.user_id
  WHERE p.triangle_id = p_to_triangle_id
    AND p.is_frozen = false
    AND ba.status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recipient not found or account inactive';
  END IF;

  IF v_sender_account_id = v_receiver_account_id THEN
    RAISE EXCEPTION 'Cannot transfer to yourself';
  END IF;

  v_reference_id := 'TXN-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 16));

  -- Create transaction
  INSERT INTO transactions (
    reference_id, type, status, amount, from_account_id,
    to_account_id, initiated_by, description, idempotency_key, completed_at
  ) VALUES (
    v_reference_id, 'transfer', 'processing', p_amount,
    v_sender_account_id, v_receiver_account_id, v_sender_id,
    p_description, p_idempotency_key, now()
  ) RETURNING id INTO v_transaction_id;

  -- Apply ledger entries
  PERFORM apply_ledger_entry(v_transaction_id, v_sender_account_id, 'debit', p_amount);
  PERFORM apply_ledger_entry(v_transaction_id, v_receiver_account_id, 'credit', p_amount);

  -- Mark completed
  UPDATE transactions SET status = 'completed' WHERE id = v_transaction_id;

  -- Notifications
  INSERT INTO notifications (user_id, type, title, body, metadata)
  VALUES
    (v_receiver_user_id, 'transfer_received', 'Money received',
     'You received $' || p_amount::TEXT || ' from a TriangleBank user.',
     jsonb_build_object('transaction_id', v_transaction_id, 'amount', p_amount)),
    (v_sender_id, 'transfer_sent', 'Transfer sent',
     'You sent $' || p_amount::TEXT || ' successfully.',
     jsonb_build_object('transaction_id', v_transaction_id, 'amount', p_amount));

  -- Audit
  PERFORM create_audit_log(
    'transfer_completed', 'transaction', v_transaction_id,
    jsonb_build_object('amount', p_amount, 'to_triangle_id', p_to_triangle_id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'reference_id', v_reference_id
  );

EXCEPTION
  WHEN OTHERS THEN
    IF v_transaction_id IS NOT NULL THEN
      UPDATE transactions SET status = 'failed' WHERE id = v_transaction_id;
    END IF;
    RAISE;
END;
$$;

-- ─────────────────────────────────────────────
-- Admin: Mint virtual money
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_mint_funds(
  p_target_triangle_id TEXT,
  p_amount NUMERIC,
  p_reason TEXT DEFAULT 'Admin mint'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id UUID;
  v_target_user_id UUID;
  v_transaction_id UUID;
  v_reference_id TEXT;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  SELECT ba.id, ba.user_id INTO v_account_id, v_target_user_id
  FROM bank_accounts ba
  JOIN profiles p ON p.id = ba.user_id
  WHERE p.triangle_id = p_target_triangle_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target account not found';
  END IF;

  v_reference_id := 'MINT-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 16));

  INSERT INTO transactions (
    reference_id, type, status, amount, to_account_id,
    initiated_by, description, completed_at
  ) VALUES (
    v_reference_id, 'admin_mint', 'completed', p_amount,
    v_account_id, auth.uid(), p_reason, now()
  ) RETURNING id INTO v_transaction_id;

  PERFORM apply_ledger_entry(v_transaction_id, v_account_id, 'credit', p_amount);

  INSERT INTO admin_logs (admin_id, action, target_user_id, details)
  VALUES (
    auth.uid(), 'mint_funds', v_target_user_id,
    jsonb_build_object('amount', p_amount, 'reason', p_reason, 'triangle_id', p_target_triangle_id)
  );

  INSERT INTO notifications (user_id, type, title, body, metadata)
  VALUES (
    v_target_user_id, 'admin_action', 'Funds added',
    '$' || p_amount::TEXT || ' has been added to your account.',
    jsonb_build_object('transaction_id', v_transaction_id, 'amount', p_amount)
  );

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'reference_id', v_reference_id
  );
END;
$$;

-- ─────────────────────────────────────────────
-- Admin: Freeze user
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_freeze_user(
  p_target_triangle_id TEXT,
  p_reason TEXT DEFAULT 'Policy violation'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_user_id UUID;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  SELECT id INTO v_target_user_id
  FROM profiles
  WHERE triangle_id = p_target_triangle_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF v_target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot freeze your own account';
  END IF;

  UPDATE profiles SET is_frozen = true WHERE id = v_target_user_id;
  UPDATE bank_accounts SET status = 'frozen' WHERE user_id = v_target_user_id;

  INSERT INTO admin_logs (admin_id, action, target_user_id, details)
  VALUES (auth.uid(), 'freeze_user', v_target_user_id, jsonb_build_object('reason', p_reason));

  INSERT INTO notifications (user_id, type, title, body)
  VALUES (v_target_user_id, 'account_frozen', 'Account frozen',
    'Your account has been frozen. Contact support for assistance.');

  RETURN jsonb_build_object('success', true, 'user_id', v_target_user_id);
END;
$$;

-- ─────────────────────────────────────────────
-- Admin: Unfreeze user
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_unfreeze_user(
  p_target_triangle_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_user_id UUID;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  SELECT id INTO v_target_user_id
  FROM profiles
  WHERE triangle_id = p_target_triangle_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  UPDATE profiles SET is_frozen = false WHERE id = v_target_user_id;
  UPDATE bank_accounts SET status = 'active' WHERE user_id = v_target_user_id;

  INSERT INTO admin_logs (admin_id, action, target_user_id, details)
  VALUES (auth.uid(), 'unfreeze_user', v_target_user_id, '{}');

  INSERT INTO notifications (user_id, type, title, body)
  VALUES (v_target_user_id, 'account_unfrozen', 'Account restored',
    'Your account has been unfrozen. Welcome back!');

  RETURN jsonb_build_object('success', true, 'user_id', v_target_user_id);
END;
$$;

-- ─────────────────────────────────────────────
-- Search users by triangle_id or username
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION search_users(p_query TEXT)
RETURNS TABLE (
  triangle_id TEXT,
  username TEXT,
  full_name TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.triangle_id, p.username, p.full_name
  FROM profiles p
  WHERE p.is_frozen = false
    AND (
      p.triangle_id ILIKE '%' || p_query || '%'
      OR p.username ILIKE '%' || p_query || '%'
    )
    AND p.id != auth.uid()
  ORDER BY p.username
  LIMIT 20;
$$;

-- Grant execute on RPC functions to authenticated users
GRANT EXECUTE ON FUNCTION transfer_funds TO authenticated;
GRANT EXECUTE ON FUNCTION search_users TO authenticated;
GRANT EXECUTE ON FUNCTION admin_mint_funds TO authenticated;
GRANT EXECUTE ON FUNCTION admin_freeze_user TO authenticated;
GRANT EXECUTE ON FUNCTION admin_unfreeze_user TO authenticated;
