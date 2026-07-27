-- TriangleBank Phase 2: Extensions and Enums
-- Run in Supabase SQL Editor or via: supabase db push

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE account_status AS ENUM ('active', 'frozen', 'closed');
CREATE TYPE transaction_type AS ENUM (
  'transfer',
  'deposit',
  'withdrawal',
  'stock_buy',
  'stock_sell',
  'admin_mint',
  'fee'
);
CREATE TYPE transaction_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled'
);
CREATE TYPE ledger_entry_type AS ENUM ('debit', 'credit');
CREATE TYPE order_side AS ENUM ('buy', 'sell');
CREATE TYPE order_type AS ENUM ('market', 'limit');
CREATE TYPE order_status AS ENUM (
  'pending',
  'partial',
  'filled',
  'cancelled',
  'rejected'
);
CREATE TYPE notification_type AS ENUM (
  'transfer_received',
  'transfer_sent',
  'transfer_failed',
  'account_frozen',
  'account_unfrozen',
  'stock_order_filled',
  'stock_order_rejected',
  'admin_action',
  'system'
);
