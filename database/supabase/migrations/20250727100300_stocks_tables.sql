-- TriangleBank Phase 2: Stock Market Tables

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

-- Named stock_orders (not "orders") to avoid reserved-word / parser issues
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
  CONSTRAINT stock_orders_filled_valid CHECK (
    filled_quantity >= 0 AND filled_quantity <= quantity
  )
);

CREATE UNIQUE INDEX idx_stock_orders_idempotency_key
  ON stock_orders (idempotency_key) WHERE idempotency_key IS NOT NULL;
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
SELECT DISTINCT ON (symbol)
  symbol,
  price,
  change_amount,
  change_percent,
  volume,
  recorded_at
FROM stock_prices
ORDER BY symbol, recorded_at DESC;
