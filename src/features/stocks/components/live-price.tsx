"use client";

import { useEffect, useRef, useState } from "react";

import { AnimatedCurrency } from "@/components/motion/animated-currency";

const PULSE_MS = 500;

/**
 * Soft live price around the last server quote — updates every 0.5s without a refresh.
 * Buy/sell still use the DB price from the last real tick.
 */
export function useLivePrice(basePrice: number): number {
  const [price, setPrice] = useState(basePrice);
  const baseRef = useRef(basePrice);
  const liveRef = useRef(basePrice);

  useEffect(() => {
    baseRef.current = basePrice;
    liveRef.current = basePrice;
    setPrice(basePrice);
  }, [basePrice]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const base = baseRef.current;
      if (!Number.isFinite(base) || base <= 0) return;

      const drift = 1 + (Math.random() * 0.004 - 0.002);
      let next = liveRef.current * drift;
      next = next + (base - next) * 0.2;
      if (next < base * 0.985) next = base * 0.985;
      if (next > base * 1.015) next = base * 1.015;
      next = Math.round(next * 100) / 100;

      liveRef.current = next;
      setPrice(next);
    }, PULSE_MS);

    return () => window.clearInterval(id);
  }, []);

  return price;
}

type LivePriceProps = {
  value: number;
  className?: string;
};

export function LivePrice({ value, className }: LivePriceProps) {
  const live = useLivePrice(value);
  if (!(value > 0)) return <span className={className}>—</span>;
  return <AnimatedCurrency value={live} className={className} />;
}
