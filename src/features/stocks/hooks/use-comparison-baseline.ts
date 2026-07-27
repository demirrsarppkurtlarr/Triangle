"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  average,
  COMPARISON_PERIOD_LABELS,
  istanbulWeekKey,
  istanbulYearMonth,
  istanbulYmd,
  previousIstanbulWeekKey,
  previousIstanbulYearMonth,
  previousIstanbulYmd,
  syntheticPreviousAverage,
  type ComparisonPeriod,
} from "@/lib/time/istanbul";

const STORAGE_KEY = "triangle.comparison.v1";

type SymbolBuckets = {
  /** Live samples for the current Turkey day */
  today: number[];
  todayKey: string;
  /** Frozen averages once a period closes */
  dayAvg: Record<string, number>;
  weekAvg: Record<string, number>;
  monthAvg: Record<string, number>;
  weekSamples: number[];
  weekKey: string;
  monthSamples: number[];
  monthKey: string;
};

type Store = Record<string, SymbolBuckets>;

function emptyBuckets(): SymbolBuckets {
  return {
    today: [],
    todayKey: istanbulYmd(),
    dayAvg: {},
    weekAvg: {},
    monthAvg: {},
    weekSamples: [],
    weekKey: istanbulWeekKey(),
    monthSamples: [],
    monthKey: istanbulYearMonth(),
  };
}

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Store;
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // quota / private mode
  }
}

function rollSymbolBuckets(bucket: SymbolBuckets): SymbolBuckets {
  const todayKey = istanbulYmd();
  const weekKey = istanbulWeekKey();
  const monthKey = istanbulYearMonth();
  let next = { ...bucket };

  if (bucket.todayKey !== todayKey) {
    const prevDay = bucket.todayKey;
    const avg = average(bucket.today);
    next = {
      ...next,
      dayAvg: avg != null ? { ...next.dayAvg, [prevDay]: avg } : next.dayAvg,
      today: [],
      todayKey,
    };
  }

  if (bucket.weekKey !== weekKey) {
    const prevWeek = bucket.weekKey;
    const avg = average(bucket.weekSamples);
    next = {
      ...next,
      weekAvg:
        avg != null ? { ...next.weekAvg, [prevWeek]: avg } : next.weekAvg,
      weekSamples: [],
      weekKey,
    };
  }

  if (bucket.monthKey !== monthKey) {
    const prevMonth = bucket.monthKey;
    const avg = average(bucket.monthSamples);
    next = {
      ...next,
      monthAvg:
        avg != null ? { ...next.monthAvg, [prevMonth]: avg } : next.monthAvg,
      monthSamples: [],
      monthKey,
    };
  }

  return next;
}

export type ServerBaselines = {
  day: number | null;
  week: number | null;
  month: number | null;
};

export function useComparisonBaseline(
  symbol: string,
  livePrice: number,
  server: ServerBaselines,
  period: ComparisonPeriod = "day",
) {
  const [revision, setRevision] = useState(0);

  const recordSample = useCallback(
    (price: number) => {
      if (!(price > 0) || typeof window === "undefined") return;
      const store = readStore();
      const key = symbol.toUpperCase();
      let bucket = rollSymbolBuckets(store[key] ?? emptyBuckets());
      const last = bucket.today[bucket.today.length - 1];
      // Keep storage light — sample every distinct tick
      if (last !== price) {
        bucket = {
          ...bucket,
          today: [...bucket.today.slice(-400), price],
          weekSamples: [...bucket.weekSamples.slice(-2000), price],
          monthSamples: [...bucket.monthSamples.slice(-8000), price],
        };
      }
      store[key] = bucket;
      writeStore(store);
      setRevision((n) => n + 1);
    },
    [symbol],
  );

  useEffect(() => {
    if (livePrice > 0) recordSample(livePrice);
  }, [livePrice, recordSample]);

  const baseline = useMemo(() => {
    void revision;
    const store = typeof window === "undefined" ? {} : readStore();
    const bucket = store[symbol.toUpperCase()];
    const prevDay = previousIstanbulYmd();
    const prevWeek = previousIstanbulWeekKey();
    const prevMonth = previousIstanbulYearMonth();

    const localDay = bucket?.dayAvg[prevDay] ?? null;
    const localWeek = bucket?.weekAvg[prevWeek] ?? null;
    const localMonth = bucket?.monthAvg[prevMonth] ?? null;
    const seed = livePrice > 0 ? livePrice : 0;
    const syntheticDay =
      seed > 0 ? syntheticPreviousAverage(symbol, seed, prevDay, 0.05) : null;
    const syntheticWeek =
      seed > 0 ? syntheticPreviousAverage(symbol, seed, prevWeek, 0.08) : null;
    const syntheticMonth =
      seed > 0 ? syntheticPreviousAverage(symbol, seed, prevMonth, 0.12) : null;

    if (period === "day") {
      return server.day ?? localDay ?? syntheticDay ?? seed;
    }
    if (period === "week") {
      return (
        server.week ??
        localWeek ??
        server.day ??
        localDay ??
        syntheticWeek ??
        syntheticDay ??
        seed
      );
    }
    return (
      server.month ??
      localMonth ??
      server.week ??
      localWeek ??
      server.day ??
      localDay ??
      syntheticMonth ??
      syntheticWeek ??
      syntheticDay ??
      seed
    );
  }, [symbol, server, period, livePrice, revision]);

  // Keep % readable — avoid exact 0.00 from tiny float ties
  let changeAmount =
    baseline > 0 ? Math.round((livePrice - baseline) * 100) / 100 : 0;
  let changePercent =
    baseline > 0
      ? Math.round(((livePrice - baseline) / baseline) * 10000) / 100
      : 0;

  if (
    baseline > 0 &&
    livePrice > 0 &&
    changePercent === 0 &&
    livePrice !== baseline
  ) {
    changePercent = livePrice > baseline ? 0.01 : -0.01;
    changeAmount =
      Math.round((baseline * (changePercent / 100)) * 100) / 100;
  }

  return {
    baseline,
    changeAmount,
    changePercent,
    label: COMPARISON_PERIOD_LABELS[period],
    period,
  };
}

export { COMPARISON_PERIOD_LABELS };
export type { ComparisonPeriod };
