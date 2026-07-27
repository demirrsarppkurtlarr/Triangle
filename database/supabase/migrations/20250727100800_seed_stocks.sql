-- TriangleBank Phase 2: Seed Stock Symbols & Initial Prices

INSERT INTO stock_symbols (symbol, name, sector, exchange) VALUES
  ('AAPL',  'Apple Inc.',              'Technology',       'NASDAQ'),
  ('MSFT',  'Microsoft Corporation',   'Technology',       'NASDAQ'),
  ('NVDA',  'NVIDIA Corporation',      'Technology',       'NASDAQ'),
  ('AMZN',  'Amazon.com Inc.',         'Consumer Cyclical','NASDAQ'),
  ('META',  'Meta Platforms Inc.',     'Technology',       'NASDAQ'),
  ('TSLA',  'Tesla Inc.',              'Consumer Cyclical','NASDAQ'),
  ('AMD',   'Advanced Micro Devices',  'Technology',       'NASDAQ'),
  ('INTC',  'Intel Corporation',       'Technology',       'NASDAQ'),
  ('NFLX',  'Netflix Inc.',            'Communication',    'NASDAQ'),
  ('GOOGL', 'Alphabet Inc.',           'Technology',       'NASDAQ'),
  ('SPY',   'SPDR S&P 500 ETF',        'ETF',              'NYSE'),
  ('QQQ',   'Invesco QQQ Trust',       'ETF',              'NASDAQ')
ON CONFLICT (symbol) DO NOTHING;

-- Simulated initial prices (virtual market)
INSERT INTO stock_prices (symbol, price, change_amount, change_percent, volume) VALUES
  ('AAPL',  227.50,  1.25,   0.55,  45000000),
  ('MSFT',  415.80,  2.10,   0.51,  22000000),
  ('NVDA',  875.30, -5.40,  -0.61,  38000000),
  ('AMZN',  185.60,  0.80,   0.43,  31000000),
  ('META',  505.20,  3.15,   0.63,  15000000),
  ('TSLA',  248.90, -2.30,  -0.92,  52000000),
  ('AMD',   162.40,  1.80,   1.12,  28000000),
  ('INTC',   22.15, -0.35,  -1.55,  42000000),
  ('NFLX',  625.00,  4.50,   0.73,   8000000),
  ('GOOGL', 175.30,  0.95,   0.54,  19000000),
  ('SPY',   545.20,  1.10,   0.20,  65000000),
  ('QQQ',   475.80,  2.40,   0.51,  40000000);
