"use client";

import { useEffect, useRef, useState } from "react";

import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";

const PULSE_MS = 280;

export type LiveQuote = {
  price: number;
  changePercent: number;
  changeAmount: number;
};

/**
 * Realistic client-side quote around the last server price.
 * Occasional jumps + normal noise; % updates with the price.
 */
export function useLiveQuote(basePrice: number): LiveQuote {
  const [quote, setQuote] = useState<LiveQuote>(() => ({
    price: basePrice,
    changePercent: 0,
    changeAmount: 0,
  }));
  const baseRef = useRef(basePrice);
  const liveRef = useRef(basePrice);
  const openRef = useRef(basePrice);

  useEffect(() => {
    baseRef.current = basePrice;
    // Re-anchor gently when server tick lands — keep session "open" for % unless far away
    if (Math.abs(liveRef.current - basePrice) / basePrice > 0.12) {
      liveRef.current = basePrice;
      openRef.current = basePrice;
    } else {
      liveRef.current = liveRef.current + (basePrice - liveRef.current) * 0.35;
    }
    const price = Math.round(liveRef.current * 100) / 100;
    const changeAmount = Math.round((price - openRef.current) * 100) / 100;
    const changePercent =
      openRef.current > 0
        ? Math.round((changeAmount / openRef.current) * 10000) / 100
        : 0;
    setQuote({ price, changePercent, changeAmount });
  }, [basePrice]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const base = baseRef.current;
      if (!Number.isFinite(base) || base <= 0) return;

      const roll = Math.random();
      let move = 0;
      if (roll < 0.07) {
        // Jump: ±1.2% … ±5%
        move = (Math.random() < 0.5 ? -1 : 1) * (0.012 + Math.random() * 0.038);
      } else if (roll < 0.22) {
        // Medium swing
        move = (Math.random() - 0.5) * 0.018;
      } else {
        // Normal tick noise
        move = (Math.random() - 0.5) * 0.006;
      }

      let next = liveRef.current * (1 + move);
      // Soft pull toward server base, still allow wide band
      next = next + (base - next) * 0.04;
      const floor = base * 0.82;
      const ceil = base * 1.22;
      if (next < floor) next = floor;
      if (next > ceil) next = ceil;
      next = Math.round(next * 100) / 100;

      liveRef.current = next;
      const changeAmount = Math.round((next - openRef.current) * 100) / 100;
      const changePercent =
        openRef.current > 0
          ? Math.round((changeAmount / openRef.current) * 10000) / 100
          : 0;
      setQuote({ price: next, changePercent, changeAmount });
    }, PULSE_MS);

    return () => window.clearInterval(id);
  }, []);

  return quote;
}

export function useLivePrice(basePrice: number): number {
  return useLiveQuote(basePrice).price;
}

type LivePriceProps = {
  value: number;
  className?: string;
};

export function LivePrice({ value, className }: LivePriceProps) {
  const live = useLivePrice(value);
  if (!(value > 0)) return <span className={className}>—</span>;
  return <span className={className}>{formatCurrency(live)}</span>;
}

type LiveChangeProps = {
  basePrice: number;
  className?: string;
};

export function LiveChange({ basePrice, className }: LiveChangeProps) {
  const { changePercent } = useLiveQuote(basePrice);
  const up = changePercent >= 0;
  return (
    <span
      className={cn(
        "font-medium tabular-nums",
        up ? "text-success" : "text-destructive",
        className,
      )}
    >
      {up ? "+" : ""}
      {changePercent.toFixed(2)}%
    </span>
  );
}

type LiveQuoteBlockProps = {
  basePrice: number;
  className?: string;
  changeClassName?: string;
};

/** Price + % sharing one quote stream (avoids two independent random walks). */
export function LiveQuoteBlock({
  basePrice,
  className,
  changeClassName,
}: LiveQuoteBlockProps) {
  const { price, changePercent } = useLiveQuote(basePrice);
  const up = changePercent >= 0;

  if (!(basePrice > 0)) {
    return <span className={className}>—</span>;
  }

  return (
    <div className={className}>
      <p className="font-semibold tabular-nums">{formatCurrency(price)}</p>
      <p
        className={cn(
          "text-xs font-medium tabular-nums",
          up ? "text-success" : "text-destructive",
          changeClassName,
        )}
      >
        {up ? "+" : ""}
        {changePercent.toFixed(2)}%
      </p>
    </div>
  );
}
