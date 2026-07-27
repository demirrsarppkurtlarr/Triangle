-- TriangleBank Phase 2: Admin, Audit, Settings, Sessions

-- ─────────────────────────────────────────────
-- admin_logs
-- ─────────────────────────────────────────────
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

-- ─────────────────────────────────────────────
-- audit_logs (immutable)
-- ─────────────────────────────────────────────
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

-- ─────────────────────────────────────────────
-- settings (global platform config)
-- ─────────────────────────────────────────────
CREATE TABLE settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  UUID REFERENCES profiles(id)
);

-- ─────────────────────────────────────────────
-- sessions (app-level session tracking for audit)
-- ─────────────────────────────────────────────
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
CREATE INDEX idx_sessions_active
  ON sessions (user_id) WHERE revoked_at IS NULL;

-- Default platform settings
INSERT INTO settings (key, value, description) VALUES
  ('transfer_daily_limit', '{"amount": 10000, "currency": "USD"}', 'Daily transfer limit per user'),
  ('transfer_single_limit', '{"amount": 5000, "currency": "USD"}', 'Single transfer limit'),
  ('transfer_fee_percent', '{"percent": 0}', 'Transfer fee percentage'),
  ('stock_trading_enabled', '{"enabled": true}', 'Enable/disable stock trading'),
  ('maintenance_mode', '{"enabled": false, "message": ""}', 'Platform maintenance mode');
