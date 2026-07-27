"use client";

import { LivePrice, useLiveQuote } from "@/features/stocks/components/live-price";
import { MarketAutoTick } from "@/features/stocks/components/market-auto-tick";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format";

type StockDetailPriceProps = {
  price: number;
  changeAmount: number;
  changePercent: number;
  marketLabel: string;
  recordedAt: string | null;
};

export function StockDetailPrice({
  price,
  marketLabel,
  recordedAt,
}: StockDetailPriceProps) {
  const quote = useLiveQuote(price);
  const up = quote.changePercent >= 0;

  return (
    <div>
      <MarketAutoTick />
      <p className="text-4xl font-semibold tracking-tight tabular-nums">
        {price > 0 ? formatCurrency(quote.price) : "—"}
      </p>
      <p
        className={cn(
          "mt-1 text-sm font-medium tabular-nums",
          up ? "text-success" : "text-destructive",
        )}
      >
        {up ? "+" : ""}
        {quote.changeAmount.toFixed(2)} ({up ? "+" : ""}
        {quote.changePercent.toFixed(2)}%)
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

export function StockDetailLiveHint({ price }: { price: number }) {
  return <LivePrice value={price} />;
}
