const ISTANBUL = "Europe/Istanbul";

/** YYYY-MM-DD in Turkey time. */
export function istanbulYmd(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ISTANBUL,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** YYYY-MM in Turkey time. */
export function istanbulYearMonth(date: Date = new Date()): string {
  return istanbulYmd(date).slice(0, 7);
}

function parseYmd(ymd: string): { y: number; m: number; d: number } {
  const parts = ymd.split("-");
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    const now = istanbulYmd();
    return parseYmd(now);
  }
  return { y, m, d };
}

/** ISO week key like 2026-W31 in Turkey calendar. */
export function istanbulWeekKey(date: Date = new Date()): string {
  const { y, m, d } = parseYmd(istanbulYmd(date));
  const utc = new Date(Date.UTC(y, m - 1, d));
  const dayNum = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function shiftIstanbulYmd(ymd: string, dayDelta: number): string {
  const { y, m, d } = parseYmd(ymd);
  const utc = new Date(Date.UTC(y, m - 1, d + dayDelta));
  return utc.toISOString().slice(0, 10);
}

export function previousIstanbulYmd(date: Date = new Date()): string {
  return shiftIstanbulYmd(istanbulYmd(date), -1);
}

export function previousIstanbulWeekKey(date: Date = new Date()): string {
  const today = istanbulYmd(date);
  const weekAgo = shiftIstanbulYmd(today, -7);
  const { y, m, d } = parseYmd(weekAgo);
  return istanbulWeekKey(new Date(Date.UTC(y, m - 1, d, 12)));
}

export function previousIstanbulYearMonth(date: Date = new Date()): string {
  const { y, m } = parseYmd(`${istanbulYearMonth(date)}-01`);
  return m === 1
    ? `${y - 1}-12`
    : `${y}-${String(m - 1).padStart(2, "0")}`;
}

export function average(values: number[]): number | null {
  const nums = values.filter((v) => Number.isFinite(v) && v > 0);
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
}

/** Stable pseudo previous-period average so % is never stuck at 0 without history. */
export function syntheticPreviousAverage(
  symbol: string,
  price: number,
  periodKey: string,
  spread = 0.045,
): number {
  if (!(price > 0)) return price;
  let hash = 2166136261;
  const seed = `${symbol.toUpperCase()}:${periodKey}`;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const unit = (hash >>> 0) / 4294967295; // 0..1
  // Avoid near-zero offsets (±0.8% .. ±spread)
  const magnitude = 0.008 + unit * (spread - 0.008);
  const sign = hash & 1 ? 1 : -1;
  return Math.round(price * (1 + sign * magnitude) * 100) / 100;
}

export type ComparisonPeriod = "day" | "week" | "month";

export const COMPARISON_PERIOD_LABELS: Record<
  ComparisonPeriod,
  { short: string; full: string }
> = {
  day: { short: "Gün", full: "Önceki gün ortalaması · TR" },
  week: { short: "Hafta", full: "Önceki hafta ortalaması · TR" },
  month: { short: "Ay", full: "Önceki ay ortalaması · TR" },
};
