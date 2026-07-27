import {
  fetchTwelveQuotes,
  getMarketStatus,
  MARKET_SYMBOLS,
  type MarketQuote,
} from "@/lib/market/twelve-data";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const STALE_MS = 14 * 60_000; // under buy/sell RPC 15-minute freshness window


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
  // Free tier ≈ 8 credits/min; each symbol costs 1. Sync a rotating half.
  const all = [...MARKET_SYMBOLS];
  const chunkSize = 6;
  const buckets = Math.ceil(all.length / chunkSize);
  const bucket = Math.floor(Date.now() / (30 * 60_000)) % buckets;
  const symbols = all.slice(bucket * chunkSize, bucket * chunkSize + chunkSize);

  const quotes = await fetchTwelveQuotes(
    symbols.length > 0 ? symbols : all.slice(0, chunkSize),
  );
  const admin = createServiceClient();

  const rows = quotes.map((q) => ({
    symbol: q.symbol,
    price: q.price,
    change_amount: q.changeAmount,
    change_percent: q.changePercent,
    volume: q.volume,
    recorded_at: new Date().toISOString(),
  }));

  if (rows.length > 0) {
    const { error } = await admin.from("stock_prices").insert(rows);
    if (error) throw new Error(error.message);
  }

  return { synced: rows.length, quotes };
}

export async function ensureFreshPrices(): Promise<MarketQuote[]> {
  const supabase = await createClient();

  const { data: latest } = await supabase
    .from("stock_prices")
    .select("symbol, price, change_amount, change_percent, volume, recorded_at")
    .order("recorded_at", { ascending: false })
    .limit(80);

  const newest = latest?.[0]?.recorded_at
    ? new Date(latest[0].recorded_at).getTime()
    : 0;
  const isStale = !newest || Date.now() - newest > STALE_MS;

  if (isStale) {
    try {
      const { quotes } = await syncMarketPrices();
      if (quotes.length > 0) return quotes;
    } catch {
      // Quota / network — keep serving last known DB prices
    }
  }

  const bySymbol = new Map<string, MarketQuote>();
  for (const row of latest ?? []) {
    if (bySymbol.has(row.symbol)) continue;
    bySymbol.set(row.symbol, {
      symbol: row.symbol,
      price: Number(row.price),
      changeAmount: Number(row.change_amount),
      changePercent: Number(row.change_percent),
      volume: Number(row.volume),
      recordedAt: row.recorded_at,
      isMarketOpen: getMarketStatus().isOpen,
    });
  }

  return [...bySymbol.values()];
}

/** Chart from our own price history — avoids Twelve Data time_series (burns quota). */
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
    supabase
      .from("stock_favorites")
      .select("symbol")
      .eq("user_id", userId),
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
  // Caller should have refreshed prices when needed; don't force API here.

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
