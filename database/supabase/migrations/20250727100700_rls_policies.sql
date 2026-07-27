-- TriangleBank Phase 2: Row Level Security Policies

-- Enable RLS on all tables
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

-- ─────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR is_admin());

CREATE POLICY "profiles_select_public_search"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    is_frozen = false
    AND id != auth.uid()
  );

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND is_admin = (SELECT p.is_admin FROM profiles p WHERE p.id = auth.uid())
    AND is_frozen = (SELECT p.is_frozen FROM profiles p WHERE p.id = auth.uid())
  );

-- ─────────────────────────────────────────────
-- bank_accounts
-- ─────────────────────────────────────────────
CREATE POLICY "bank_accounts_select_own"
  ON bank_accounts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- No INSERT/UPDATE/DELETE for users — handled by triggers/functions

-- ─────────────────────────────────────────────
-- transactions
-- ─────────────────────────────────────────────
CREATE POLICY "transactions_select_own"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    initiated_by = auth.uid()
    OR from_account_id IN (SELECT id FROM bank_accounts WHERE user_id = auth.uid())
    OR to_account_id IN (SELECT id FROM bank_accounts WHERE user_id = auth.uid())
    OR is_admin()
  );

-- No direct INSERT — only via transfer_funds() SECURITY DEFINER

-- ─────────────────────────────────────────────
-- ledger_entries
-- ─────────────────────────────────────────────
CREATE POLICY "ledger_entries_select_own"
  ON ledger_entries FOR SELECT
  TO authenticated
  USING (
    account_id IN (SELECT id FROM bank_accounts WHERE user_id = auth.uid())
    OR is_admin()
  );

-- ─────────────────────────────────────────────
-- notifications
-- ─────────────────────────────────────────────
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- stock_symbols & stock_prices (read-only for users)
-- ─────────────────────────────────────────────
CREATE POLICY "stock_symbols_select_all"
  ON stock_symbols FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "stock_prices_select_all"
  ON stock_prices FOR SELECT
  TO authenticated
  USING (true);

-- ─────────────────────────────────────────────
-- portfolios
-- ─────────────────────────────────────────────
CREATE POLICY "portfolios_select_own"
  ON portfolios FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- ─────────────────────────────────────────────
-- orders
-- ─────────────────────────────────────────────
CREATE POLICY "stock_orders_select_own"
  ON stock_orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- ─────────────────────────────────────────────
-- trades
-- ─────────────────────────────────────────────
CREATE POLICY "trades_select_own"
  ON trades FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- ─────────────────────────────────────────────
-- stock_favorites
-- ─────────────────────────────────────────────
CREATE POLICY "stock_favorites_select_own"
  ON stock_favorites FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "stock_favorites_insert_own"
  ON stock_favorites FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "stock_favorites_delete_own"
  ON stock_favorites FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- admin_logs (admin only)
-- ─────────────────────────────────────────────
CREATE POLICY "admin_logs_select_admin"
  ON admin_logs FOR SELECT
  TO authenticated
  USING (is_admin());

-- ─────────────────────────────────────────────
-- audit_logs (admin only)
-- ─────────────────────────────────────────────
CREATE POLICY "audit_logs_select_admin"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "audit_logs_select_own"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- settings
-- ─────────────────────────────────────────────
CREATE POLICY "settings_select_all"
  ON settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "settings_update_admin"
  ON settings FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ─────────────────────────────────────────────
-- sessions
-- ─────────────────────────────────────────────
CREATE POLICY "sessions_select_own"
  ON sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "sessions_insert_own"
  ON sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "sessions_update_own"
  ON sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- Realtime publication (for balance & notifications)
-- ─────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE bank_accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
