const MARKET_SYMBOLS = [
  "AAPL",
  "AMD",
  "AMZN",
  "GOOGL",
  "INTC",
  "META",
  "MSFT",
  "NFLX",
  "NVDA",
  "QQQ",
  "SPY",
  "TSLA",
] as const;

export type MarketSymbol = (typeof MARKET_SYMBOLS)[number];

export { MARKET_SYMBOLS };

/** Seed prices used by the game economy (also mirrored in tick_game_prices SQL). */
export const SEED_PRICES: Record<MarketSymbol, number> = {
  AAPL: 227.5,
  AMD: 480.32,
  AMZN: 185.6,
  GOOGL: 327.84,
  INTC: 88.99,
  META: 505.2,
  MSFT: 415.8,
  NFLX: 71.27,
  NVDA: 875.3,
  QQQ: 677.9,
  SPY: 737.0,
  TSLA: 248.9,
};

export type MarketQuote = {
  symbol: string;
  price: number;
  changeAmount: number;
  changePercent: number;
  volume: number;
  recordedAt: string;
  isMarketOpen: boolean;
};

export function getMarketStatus(): {
  isOpen: boolean;
  label: string;
} {
  return {
    isOpen: true,
    label: "Simulated · live every 0.5s",
  };
}

/** Soft client-side pulse around a server price for visual life between ticks. */
export function pulsePrice(price: number, seed = Date.now()): number {
  if (!Number.isFinite(price) || price <= 0) return price;
  const wave = Math.sin(seed / 500) * 0.002;
  return Math.round(price * (1 + wave) * 100) / 100;
}
