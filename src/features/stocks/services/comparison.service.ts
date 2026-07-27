import {
  average,
  istanbulWeekKey,
  istanbulYearMonth,
  istanbulYmd,
  previousIstanbulWeekKey,
  previousIstanbulYearMonth,
  previousIstanbulYmd,
  syntheticPreviousAverage,
} from "@/lib/time/istanbul";
import { createClient } from "@/lib/supabase/server";

export type ComparisonBaselines = {
  day: number | null;
  week: number | null;
  month: number | null;
  dayKey: string;
  weekKey: string;
  monthKey: string;
};

function emptyBaselines(
  symbol: string,
  fallback: number | null,
  dayKey: string,
  weekKey: string,
  monthKey: string,
): ComparisonBaselines {
  const price = fallback != null && fallback > 0 ? fallback : null;
  return {
    day: price != null ? syntheticPreviousAverage(symbol, price, dayKey, 0.05) : null,
    week:
      price != null ? syntheticPreviousAverage(symbol, price, weekKey, 0.08) : null,
    month:
      price != null
        ? syntheticPreviousAverage(symbol, price, monthKey, 0.12)
        : null,
    dayKey,
    weekKey,
    monthKey,
  };
}

/**
 * Average prices for previous Turkey calendar day / week / month
 * from recorded stock_prices history.
 */
export async function getComparisonBaselines(
  symbol: string,
  fallbackPrice: number,
): Promise<ComparisonBaselines> {
  const map = await getComparisonBaselinesMap(
    [symbol],
    { [symbol.toUpperCase()]: fallbackPrice },
  );
  return (
    map[symbol.toUpperCase()] ??
    emptyBaselines(
      symbol.toUpperCase(),
      fallbackPrice > 0 ? fallbackPrice : null,
      previousIstanbulYmd(),
      previousIstanbulWeekKey(),
      previousIstanbulYearMonth(),
    )
  );
}

export async function getComparisonBaselinesMap(
  symbols: string[],
  fallbacks: Record<string, number>,
): Promise<Record<string, ComparisonBaselines>> {
  const dayKey = previousIstanbulYmd();
  const weekKey = previousIstanbulWeekKey();
  const monthKey = previousIstanbulYearMonth();
  const upper = [...new Set(symbols.map((s) => s.toUpperCase()))];
  const result: Record<string, ComparisonBaselines> = {};

  for (const symbol of upper) {
    const fb = fallbacks[symbol];
    result[symbol] = emptyBaselines(
      symbol,
      fb != null && fb > 0 ? fb : null,
      dayKey,
      weekKey,
      monthKey,
    );
  }

  if (upper.length === 0) return result;

  const supabase = await createClient();
  const { data } = await supabase
    .from("stock_prices")
    .select("symbol, price, recorded_at")
    .in("symbol", upper)
    .order("recorded_at", { ascending: true })
    .limit(12000);

  const dayPrices: Record<string, number[]> = {};
  const weekPrices: Record<string, number[]> = {};
  const monthPrices: Record<string, number[]> = {};

  for (const row of data ?? []) {
    const symbol = row.symbol;
    const price = Number(row.price);
    if (!Number.isFinite(price) || price <= 0) continue;
    const at = new Date(row.recorded_at);

    if (istanbulYmd(at) === dayKey) {
      (dayPrices[symbol] ??= []).push(price);
    }
    if (istanbulWeekKey(at) === weekKey) {
      (weekPrices[symbol] ??= []).push(price);
    }
    if (istanbulYearMonth(at) === monthKey) {
      (monthPrices[symbol] ??= []).push(price);
    }
  }

  for (const symbol of upper) {
    const fb = fallbacks[symbol];
    const seed = fb != null && fb > 0 ? fb : null;
    const syntheticDay =
      seed != null ? syntheticPreviousAverage(symbol, seed, dayKey, 0.05) : null;
    const syntheticWeek =
      seed != null ? syntheticPreviousAverage(symbol, seed, weekKey, 0.08) : null;
    const syntheticMonth =
      seed != null
        ? syntheticPreviousAverage(symbol, seed, monthKey, 0.12)
        : null;

    const day = average(dayPrices[symbol] ?? []) ?? syntheticDay;
    const week = average(weekPrices[symbol] ?? []) ?? syntheticWeek ?? day;
    const month = average(monthPrices[symbol] ?? []) ?? syntheticMonth ?? week;

    result[symbol] = {
      day,
      week,
      month,
      dayKey,
      weekKey,
      monthKey,
    };
  }

  return result;
}
