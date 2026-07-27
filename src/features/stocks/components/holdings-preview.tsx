"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useLivePrices } from "@/features/stocks/hooks/use-live-market";
import type { PortfolioHolding } from "@/features/stocks/services/market.service";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";

type HoldingsPreviewProps = {
  holdings: PortfolioHolding[];
};

export function HoldingsPreview({ holdings }: HoldingsPreviewProps) {
  const bases = useMemo(
    () =>
      Object.fromEntries(holdings.map((h) => [h.symbol, h.price])) as Record<
        string,
        number
      >,
    [holdings],
  );
  const livePrices = useLivePrices(bases);

  const liveHoldings = useMemo(() => {
    return holdings.map((h) => {
      const price = livePrices[h.symbol] ?? h.price;
      const marketValue = h.quantity * price;
      const pnl = marketValue - h.costBasis;
      const pnlPercent = h.costBasis > 0 ? (pnl / h.costBasis) * 100 : 0;
      return { ...h, price, marketValue, pnl, pnlPercent };
    });
  }, [holdings, livePrices]);

  if (holdings.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border/70 px-6 py-8 text-center text-sm text-muted-foreground">
        No holdings yet. Buy your first virtual shares from the market.
      </div>
    );
  }

  const totalValue = liveHoldings.reduce((sum, h) => sum + h.marketValue, 0);
  const totalPnl = liveHoldings.reduce((sum, h) => sum + h.pnl, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Portfolio value</p>
          <p className="text-2xl font-semibold tabular-nums">
            {formatCurrency(totalValue)}
          </p>
        </div>
        <p
          className={cn(
            "text-sm font-medium tabular-nums",
            totalPnl >= 0 ? "text-success" : "text-destructive",
          )}
        >
          {totalPnl >= 0 ? "+" : ""}
          {formatCurrency(totalPnl)} P/L
        </p>
      </div>

      <ul className="space-y-2">
        {liveHoldings.map((h) => (
          <li key={h.symbol}>
            <Link
              href={`/stocks/${h.symbol}`}
              prefetch
              className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-border/50 bg-card/80 px-4 py-3 transition-colors hover:bg-secondary/50 active:scale-[0.99]"
            >
              <div>
                <p className="font-semibold">{h.symbol}</p>
                <p className="text-xs text-muted-foreground">
                  {h.quantity} shares · avg {formatCurrency(h.averageCost)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium tabular-nums">
                  {formatCurrency(h.marketValue)}
                </p>
                <p
                  className={cn(
                    "text-xs tabular-nums",
                    h.pnl >= 0 ? "text-success" : "text-destructive",
                  )}
                >
                  {h.pnl >= 0 ? "+" : ""}
                  {h.pnlPercent.toFixed(2)}%
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
