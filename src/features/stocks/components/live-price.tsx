"use client";

import { useEffect, useRef, useState } from "react";

import {
  useComparisonBaseline,
  type ServerBaselines,
} from "@/features/stocks/hooks/use-comparison-baseline";
import { useLiveQuote } from "@/features/stocks/hooks/use-live-market";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";

export { useLivePrices, useLiveQuote } from "@/features/stocks/hooks/use-live-market";
export type { LiveQuote } from "@/features/stocks/hooks/use-live-market";

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
  symbol: string;
  basePrice: number;
  baselines?: ServerBaselines;
  className?: string;
  changeClassName?: string;
};

/** Market list: always vs previous Turkey day average. */
export function LiveQuoteBlock({
  symbol,
  basePrice,
  baselines,
  className,
  changeClassName,
}: LiveQuoteBlockProps) {
  const { price } = useLiveQuote(basePrice);
  const cmp = useComparisonBaseline(
    symbol,
    price,
    baselines ?? { day: null, week: null, month: null },
    "day",
  );
  const up = cmp.changePercent >= 0;

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
        {cmp.changePercent.toFixed(2)}%
        <span className="ml-1 text-[10px] font-normal text-muted-foreground">
          gün
        </span>
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
