"use client";

import { useEffect, useRef, useState } from "react";

import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";
import {
  useLivePrices,
  useLiveQuote,
  type LiveQuote,
} from "@/features/stocks/hooks/use-live-market";

export type { LiveQuote };
export { useLivePrices, useLiveQuote } from "@/features/stocks/hooks/use-live-market";

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

type LiveQuoteBlockProps = {
  basePrice: number;
  className?: string;
  changeClassName?: string;
};

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

/** Append live prices into a scrolling tape for charts. */
export function useLiveChartSeries(
  livePrice: number,
  seed: { datetime: string; close: number }[],
  maxPoints = 72,
): { datetime: string; close: number }[] {
  const [points, setPoints] = useState(() =>
    seed.length > 0
      ? seed.slice(-maxPoints)
      : livePrice > 0
        ? [{ datetime: new Date().toISOString(), close: livePrice }]
        : [],
  );
  const lastRef = useRef<number | null>(null);

  useEffect(() => {
    if (!(livePrice > 0)) return;
    if (lastRef.current === livePrice) return;
    lastRef.current = livePrice;
    setPoints((prev) => {
      const next = [
        ...prev,
        { datetime: new Date().toISOString(), close: livePrice },
      ];
      return next.slice(-maxPoints);
    });
  }, [livePrice, maxPoints]);

  return points;
}
