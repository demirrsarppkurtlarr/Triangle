const MARKET_SYMBOLS = [
  "AAPL",
  "MSFT",
  "NVDA",
  "AMZN",
  "META",
  "TSLA",
  "AMD",
  "INTC",
  "NFLX",
  "GOOGL",
  "SPY",
  "QQQ",
] as const;

export type MarketSymbol = (typeof MARKET_SYMBOLS)[number];

export { MARKET_SYMBOLS };

export type TwelveQuote = {
  symbol: string;
  name?: string;
  close: number;
  previous_close?: number;
  percent_change?: number;
  change?: number;
  volume?: number;
  datetime?: string;
  is_market_open?: boolean;
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

function getApiKey() {
  const key = process.env.TWELVE_DATA_API_KEY;
  if (!key) {
    throw new Error(
      "Missing TWELVE_DATA_API_KEY. Add it to .env.local and Render environment variables.",
    );
  }
  return key;
}

export function getMarketStatus(now = new Date()): {
  isOpen: boolean;
  label: string;
} {
  // US equities approximate: Mon–Fri 9:30–16:00 America/New_York
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);

  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  const mins = hour * 60 + minute;

  if (weekday === "Sat" || weekday === "Sun") {
    return { isOpen: false, label: "Market closed · Weekend" };
  }

  const open = 9 * 60 + 30;
  const close = 16 * 60;

  if (mins >= open && mins < close) {
    return { isOpen: true, label: "Market open · NYSE / NASDAQ" };
  }

  return { isOpen: false, label: "Market closed · Outside US session" };
}

export async function fetchTwelveQuotes(
  symbols: string[] = [...MARKET_SYMBOLS],
): Promise<MarketQuote[]> {
  const apiKey = getApiKey();
  const joined = symbols.join(",");
  const url = new URL("https://api.twelvedata.com/quote");
  url.searchParams.set("symbol", joined);
  url.searchParams.set("apikey", apiKey);

  const response = await fetch(url.toString(), {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(
        "Twelve Data rate limit (429). Using cached prices — wait a minute or upgrade your API plan.",
      );
    }
    throw new Error(`Twelve Data error: ${response.status}`);
  }

  const payload = (await response.json()) as
    | Record<string, TwelveQuote>
    | TwelveQuote
    | { status?: string; message?: string; code?: number };

  if (
    payload &&
    typeof payload === "object" &&
    "status" in payload &&
    payload.status === "error"
  ) {
    const code = "code" in payload ? Number(payload.code) : 0;
    const message =
      "message" in payload && typeof payload.message === "string"
        ? payload.message
        : "Twelve Data request failed";
    if (code === 429 || /limit|quota|429/i.test(message)) {
      throw new Error(
        "Twelve Data rate limit (429). Using cached prices — wait a minute or upgrade your API plan.",
      );
    }
    throw new Error(message);
  }

  const quotes: TwelveQuote[] = [];

  if ("symbol" in payload && typeof (payload as TwelveQuote).symbol === "string") {
    quotes.push(payload as TwelveQuote);
  } else {
    for (const value of Object.values(payload as Record<string, TwelveQuote>)) {
      if (value && typeof value === "object" && "symbol" in value) {
        quotes.push(value);
      }
    }
  }

  const market = getMarketStatus();

  return quotes
    .map((q) => {
      const price = Number(q.close);
      if (!Number.isFinite(price) || price <= 0) return null;

      return {
        symbol: q.symbol,
        price,
        changeAmount: Number(q.change ?? 0),
        changePercent: Number(q.percent_change ?? 0),
        volume: Number(q.volume ?? 0),
        recordedAt: q.datetime
          ? new Date(q.datetime).toISOString()
          : new Date().toISOString(),
        isMarketOpen: q.is_market_open ?? market.isOpen,
      } satisfies MarketQuote;
    })
    .filter((q): q is MarketQuote => q !== null);
}

export async function fetchTimeSeries(
  symbol: string,
  interval: "5min" | "1h" | "1day" = "1day",
  outputsize = 30,
): Promise<{ datetime: string; close: number }[]> {
  const apiKey = getApiKey();
  const url = new URL("https://api.twelvedata.com/time_series");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", interval);
  url.searchParams.set("outputsize", String(outputsize));
  url.searchParams.set("apikey", apiKey);

  const response = await fetch(url.toString(), {
    next: { revalidate: 120 },
  });

  if (!response.ok) {
    throw new Error(`Twelve Data time series error: ${response.status}`);
  }

  const payload = (await response.json()) as {
    values?: { datetime: string; close: string }[];
    status?: string;
    message?: string;
  };

  if (payload.status === "error") {
    throw new Error(payload.message ?? "Failed to load chart data");
  }

  return (payload.values ?? [])
    .map((v) => ({
      datetime: v.datetime,
      close: Number(v.close),
    }))
    .filter((v) => Number.isFinite(v.close))
    .reverse();
}
