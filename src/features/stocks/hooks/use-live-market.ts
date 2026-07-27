"use client";

import { useEffect, useRef, useState } from "react";

/** UI only refreshes every 3s — hidden micro-steps run inside that window. */
export const LIVE_PULSE_MS = 3000;
/** Half-second-scale steps batched into one visible update (3s ≈ 6 × 0.5s). */
const HIDDEN_STEPS_PER_TICK = 6;

export type LiveQuote = {
  price: number;
  changePercent: number;
  changeAmount: number;
};

/**
 * One half-second-scale random-walk step (not shown alone).
 */
export function stepLivePrice(live: number, base: number): number {
  if (!Number.isFinite(base) || base <= 0) return live;

  const roll = Math.random();
  let move = 0;
  if (roll < 0.12) {
    move = (Math.random() < 0.5 ? -1 : 1) * (0.03 + Math.random() * 0.05);
  } else if (roll < 0.4) {
    move = (Math.random() < 0.5 ? -1 : 1) * (0.012 + Math.random() * 0.016);
  } else {
    move = (Math.random() < 0.5 ? -1 : 1) * (0.005 + Math.random() * 0.009);
  }

  let next = live * (1 + move);
  next = next + (base - next) * 0.02;
  const floor = base * 0.65;
  const ceil = base * 1.45;
  if (next < floor) next = floor;
  if (next > ceil) next = ceil;
  return Math.round(next * 100) / 100;
}

/** Apply 6 hidden half-second steps, return only the final price for the UI. */
export function advanceLivePrice(
  live: number,
  base: number,
  steps = HIDDEN_STEPS_PER_TICK,
): number {
  let next = live;
  for (let i = 0; i < steps; i += 1) {
    next = stepLivePrice(next, base);
  }
  return next;
}

function toQuote(price: number, open: number): LiveQuote {
  const changeAmount = Math.round((price - open) * 100) / 100;
  const changePercent =
    open > 0 ? Math.round((changeAmount / open) * 10000) / 100 : 0;
  return { price, changePercent, changeAmount };
}

export function useLiveQuote(basePrice: number): LiveQuote {
  const [quote, setQuote] = useState<LiveQuote>(() =>
    toQuote(basePrice, basePrice),
  );
  const baseRef = useRef(basePrice);
  const liveRef = useRef(basePrice);
  const openRef = useRef(basePrice);

  useEffect(() => {
    baseRef.current = basePrice;
    if (
      basePrice > 0 &&
      Math.abs(liveRef.current - basePrice) / basePrice > 0.2
    ) {
      liveRef.current = basePrice;
      openRef.current = basePrice;
    } else if (basePrice > 0) {
      liveRef.current = liveRef.current + (basePrice - liveRef.current) * 0.2;
    }
    setQuote(toQuote(liveRef.current, openRef.current));
  }, [basePrice]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const base = baseRef.current;
      if (!Number.isFinite(base) || base <= 0) return;
      const next = advanceLivePrice(liveRef.current, base);
      liveRef.current = next;
      setQuote(toQuote(next, openRef.current));
    }, LIVE_PULSE_MS);
    return () => window.clearInterval(id);
  }, []);

  return quote;
}

/** Shared pulse for many symbols (portfolio / market snapshot). */
export function useLivePrices(
  bases: Record<string, number>,
): Record<string, number> {
  const [prices, setPrices] = useState(bases);
  const baseRef = useRef(bases);
  const liveRef = useRef({ ...bases });

  useEffect(() => {
    baseRef.current = bases;
    const live = { ...liveRef.current };
    for (const [symbol, base] of Object.entries(bases)) {
      if (!(symbol in live) || !Number.isFinite(live[symbol])) {
        live[symbol] = base;
      } else if (base > 0) {
        const current = live[symbol] ?? base;
        live[symbol] = current + (base - current) * 0.2;
      }
    }
    liveRef.current = live;
    setPrices({ ...live });
  }, [bases]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const baseMap = baseRef.current;
      const next: Record<string, number> = { ...liveRef.current };
      for (const [symbol, base] of Object.entries(baseMap)) {
        const current = next[symbol] ?? base;
        next[symbol] = advanceLivePrice(current, base);
      }
      liveRef.current = next;
      setPrices({ ...next });
    }, LIVE_PULSE_MS);
    return () => window.clearInterval(id);
  }, []);

  return prices;
}
