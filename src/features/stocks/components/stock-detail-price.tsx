"use client";

import { LivePrice } from "@/features/stocks/components/live-price";
import { MarketAutoTick } from "@/features/stocks/components/market-auto-tick";
import { cn } from "@/lib/utils";

type StockDetailPriceProps = {
  price: number;
  changeAmount: number;
  changePercent: number;
  marketLabel: string;
  recordedAt: string | null;
};

export function StockDetailPrice({
  price,
  changeAmount,
  changePercent,
  marketLabel,
  recordedAt,
}: StockDetailPriceProps) {
  const up = changePercent >= 0;

  return (
    <div>
      <MarketAutoTick />
      <p className="text-4xl font-semibold tracking-tight">
        <LivePrice value={price} />
      </p>
      <p
        className={cn(
          "mt-1 text-sm font-medium",
          up ? "text-success" : "text-destructive",
        )}
      >
        {up ? "+" : ""}
        {changeAmount.toFixed(2)} ({up ? "+" : ""}
        {changePercent.toFixed(2)}%)
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {marketLabel}
        {recordedAt
          ? ` · Server tick ${new Date(recordedAt).toLocaleTimeString()}`
          : ""}
      </p>
    </div>
  );
}
