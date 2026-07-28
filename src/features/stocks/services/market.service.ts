import {
  getMarketStatus,
  MARKET_SYMBOLS,
  type MarketQuote,
} from "@/lib/market/simulated-market";
import { createClient } from "@/lib/supabase/server";

/** Tick when quotes older than 10s — global shared cadence. */
const STALE_MS = 10_000;

export type StockListItem = {
  symbol: string;
  name: string;
  sector: string | null;
  exchange: string;
  price: number;
  changeAmount: number;
  changePercent: number;
  volume: number;
  recordedAt: string | null;
  isFavorite: boolean;
};

export type PortfolioHolding = {
  symbol: string;
  quantity: number;
  averageCost: number;
  price: number;
  marketValue: number;
  costBasis: number;
  pnl: number;
  pnlPercent: number;
};

export async function syncMarketPrices(): Promise<{
  synced: number;
  quotes: MarketQuote[];
}> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("tick_game_prices");
  if (error) throw new Error(error.message);

  const synced =
    data && typeof data === "object" && "synced" in data
      ? Number((data as { synced: number }).synced)
      : MARKET_SYMBOLS.length;

  const quotes = await loadLatestQuotes();
  return { synced, quotes };
}

async function loadLatestQuotes(): Promise<MarketQuote[]> {
  const supabase = await createClient();
  const { data: latest } = await supabase
    .from("stock_prices")
    .select("symbol, price, change_amount, change_percent, volume, recorded_at")
    .order("recorded_at", { ascending: false })
    .limit(80);

  const bySymbol = new Map<string, MarketQuote>();
  const status = getMarketStatus();

  for (const row of latest ?? []) {
    if (bySymbol.has(row.symbol)) continue;
    bySymbol.set(row.symbol, {
      symbol: row.symbol,
      price: Number(row.price),
      changeAmount: Number(row.change_amount),
      changePercent: Number(row.change_percent),
      volume: Number(row.volume),
      recordedAt: row.recorded_at,
      isMarketOpen: status.isOpen,
    });
  }

  return [...bySymbol.values()];
}

export async function ensureFreshPrices(): Promise<MarketQuote[]> {
  const quotes = await loadLatestQuotes();
  const newest = quotes.reduce((max, q) => {
    const t = q.recordedAt ? new Date(q.recordedAt).getTime() : 0;
    return t > max ? t : max;
  }, 0);
  const isStale = !newest || Date.now() - newest > STALE_MS;

  if (isStale) {
    try {
      const { quotes: fresh } = await syncMarketPrices();
      if (fresh.length > 0) return fresh;
    } catch {
      // Keep last known DB prices if tick fails
    }
  }

  return quotes;
}

export async function getPriceHistory(
  symbol: string,
  limit = 48,
): Promise<{ datetime: string; close: number }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stock_prices")
    .select("price, recorded_at")
    .eq("symbol", symbol.toUpperCase())
    .order("recorded_at", { ascending: true })
    .limit(limit);

  return (data ?? [])
    .map((row) => ({
      datetime: row.recorded_at,
      close: Number(row.price),
    }))
    .filter((row) => Number.isFinite(row.close) && row.close > 0);
}

export type TradeMarker = {
  datetime: string;
  price: number;
  quantity: number;
  side: "buy" | "sell";
};

export async function getUserTradeMarkers(
  userId: string,
  symbol: string,
  limit = 40,
): Promise<TradeMarker[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("trades")
    .select("side, quantity, price, executed_at")
    .eq("user_id", userId)
    .eq("symbol", symbol.toUpperCase())
    .order("executed_at", { ascending: true })
    .limit(limit);

  return (data ?? []).map((row) => ({
    datetime: row.executed_at,
    price: Number(row.price),
    quantity: Number(row.quantity),
    side: row.side === "sell" ? "sell" : "buy",
  }));
}

export async function getMarketList(
  userId: string,
  preloadedQuotes?: MarketQuote[],
): Promise<{
  stocks: StockListItem[];
  marketLabel: string;
  isOpen: boolean;
}> {
  const supabase = await createClient();
  const quotes = preloadedQuotes ?? (await ensureFreshPrices());
  const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));

  const [{ data: symbols }, { data: favorites }] = await Promise.all([
    supabase
      .from("stock_symbols")
      .select("symbol, name, sector, exchange")
      .eq("is_active", true)
      .order("symbol"),
    supabase.from("stock_favorites").select("symbol").eq("user_id", userId),
  ]);

  const favoriteSet = new Set((favorites ?? []).map((f) => f.symbol));
  const status = getMarketStatus();

  const stocks: StockListItem[] = (symbols ?? []).map((s) => {
    const quote = quoteMap.get(s.symbol);
    return {
      symbol: s.symbol,
      name: s.name,
      sector: s.sector,
      exchange: s.exchange,
      price: quote?.price ?? 0,
      changeAmount: quote?.changeAmount ?? 0,
      changePercent: quote?.changePercent ?? 0,
      volume: quote?.volume ?? 0,
      recordedAt: quote?.recordedAt ?? null,
      isFavorite: favoriteSet.has(s.symbol),
    };
  });

  return {
    stocks,
    marketLabel: status.label,
    isOpen: status.isOpen,
  };
}

export async function getPortfolioHoldings(
  userId: string,
  preloadedQuotes?: MarketQuote[],
): Promise<PortfolioHolding[]> {
  const supabase = await createClient();
  const quotes = preloadedQuotes ?? (await ensureFreshPrices());
  const quoteMap = new Map(quotes.map((q) => [q.symbol, q.price]));

  const { data } = await supabase
    .from("portfolios")
    .select("symbol, quantity, average_cost")
    .eq("user_id", userId)
    .order("symbol");

  return (data ?? []).map((row) => {
    const quantity = Number(row.quantity);
    const averageCost = Number(row.average_cost);
    const price = quoteMap.get(row.symbol) ?? averageCost;
    const marketValue = quantity * price;
    const costBasis = quantity * averageCost;
    const pnl = marketValue - costBasis;
    const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

    return {
      symbol: row.symbol,
      quantity,
      averageCost,
      price,
      marketValue,
      costBasis,
      pnl,
      pnlPercent,
    };
  });
}

export async function getStockDetail(symbol: string, userId: string) {
  const supabase = await createClient();

  const [{ data: meta }, { data: price }, { data: favorite }, { data: holding }] =
    await Promise.all([
      supabase
        .from("stock_symbols")
        .select("symbol, name, sector, exchange")
        .eq("symbol", symbol)
        .single(),
      supabase
        .from("stock_prices")
        .select("price, change_amount, change_percent, volume, recorded_at")
        .eq("symbol", symbol)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("stock_favorites")
        .select("symbol")
        .eq("user_id", userId)
        .eq("symbol", symbol)
        .maybeSingle(),
      supabase
        .from("portfolios")
        .select("quantity, average_cost")
        .eq("user_id", userId)
        .eq("symbol", symbol)
        .maybeSingle(),
    ]);

  if (!meta) return null;

  return {
    ...meta,
    price: Number(price?.price ?? 0),
    changeAmount: Number(price?.change_amount ?? 0),
    changePercent: Number(price?.change_percent ?? 0),
    volume: Number(price?.volume ?? 0),
    recordedAt: price?.recorded_at ?? null,
    isFavorite: Boolean(favorite),
    holding: holding
      ? {
          quantity: Number(holding.quantity),
          averageCost: Number(holding.average_cost),
        }
      : null,
    market: getMarketStatus(),
  };
}
