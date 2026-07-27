-- TriangleBank Phase 2: Core Tables (profiles, bank_accounts, transactions, ledger)

-- ─────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────
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

  CONSTRAINT profiles_triangle_id_format
    CHECK (triangle_id ~ '^TR-\d{4}-\d{4}-\d{4}$'),
  CONSTRAINT profiles_username_length
    CHECK (char_length(username) BETWEEN 3 AND 32),
  CONSTRAINT profiles_username_format
    CHECK (username ~ '^[a-zA-Z0-9_]+$')
);

CREATE UNIQUE INDEX idx_profiles_triangle_id ON profiles (triangle_id);
CREATE UNIQUE INDEX idx_profiles_username ON profiles (username);
CREATE UNIQUE INDEX idx_profiles_email ON profiles (email);
CREATE INDEX idx_profiles_is_frozen ON profiles (is_frozen) WHERE is_frozen = true;
CREATE INDEX idx_profiles_created_at ON profiles (created_at DESC);

-- ─────────────────────────────────────────────
-- bank_accounts
-- ─────────────────────────────────────────────
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
  CONSTRAINT bank_accounts_account_number_format
    CHECK (account_number ~ '^AC-[A-Z0-9]{12}$')
);

CREATE UNIQUE INDEX idx_bank_accounts_account_number ON bank_accounts (account_number);
CREATE UNIQUE INDEX idx_bank_accounts_user_id ON bank_accounts (user_id);
CREATE INDEX idx_bank_accounts_status ON bank_accounts (status);

-- ─────────────────────────────────────────────
-- transactions
-- ─────────────────────────────────────────────
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
  CONSTRAINT transactions_reference_id_format
    CHECK (char_length(reference_id) >= 8)
);

CREATE UNIQUE INDEX idx_transactions_reference_id ON transactions (reference_id);
CREATE UNIQUE INDEX idx_transactions_idempotency_key
  ON transactions (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_transactions_from_account ON transactions (from_account_id);
CREATE INDEX idx_transactions_to_account ON transactions (to_account_id);
CREATE INDEX idx_transactions_initiated_by ON transactions (initiated_by);
CREATE INDEX idx_transactions_status ON transactions (status);
CREATE INDEX idx_transactions_type ON transactions (type);
CREATE INDEX idx_transactions_created_at ON transactions (created_at DESC);

-- ─────────────────────────────────────────────
-- ledger_entries (immutable, append-only)
-- ─────────────────────────────────────────────
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
CREATE INDEX idx_ledger_entries_account_created
  ON ledger_entries (account_id, created_at DESC);
