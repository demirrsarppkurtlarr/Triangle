"use client";

import { useEffect, useState } from "react";

/** Global market cadence — same for every client. */
export const LIVE_PULSE_MS = 10_000;

export type LiveQuote = {
  price: number;
  changePercent: number;
  changeAmount: number;
};

function toQuote(price: number, open: number): LiveQuote {
  const changeAmount = Math.round((price - open) * 100) / 100;
  const changePercent =
    open > 0 ? Math.round((changeAmount / open) * 10000) / 100 : 0;
  return { price, changePercent, changeAmount };
}

/**
 * Displays the shared server price only — no per-client random walk.
 * Everyone sees the same number until the next global 10s tick.
 */
export function useLiveQuote(basePrice: number): LiveQuote {
  const [quote, setQuote] = useState<LiveQuote>(() =>
    toQuote(basePrice, basePrice),
  );
  const [open] = useState(basePrice);

  useEffect(() => {
    if (!(basePrice > 0)) return;
    setQuote(toQuote(basePrice, open > 0 ? open : basePrice));
  }, [basePrice, open]);

  return quote;
}

/** Shared prices map — mirrors server bases, no local drift. */
export function useLivePrices(
  bases: Record<string, number>,
): Record<string, number> {
  const [prices, setPrices] = useState(bases);

  useEffect(() => {
    setPrices({ ...bases });
  }, [bases]);

  return prices;
}

/** @deprecated Kept for imports; no longer steps locally. */
export function stepLivePrice(live: number, _base: number): number {
  return live;
}

/** @deprecated Kept for imports; no longer advances locally. */
export function advanceLivePrice(live: number, _base?: number): number {
  return live;
}
