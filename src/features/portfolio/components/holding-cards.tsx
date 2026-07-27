"use client";

import Link from "next/link";

import { MotionProgress } from "@/components/motion/motion-progress";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import type { PortfolioHolding } from "@/features/stocks/services/market.service";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";

type HoldingCardsProps = {
  holdings: PortfolioHolding[];
  totalValue: number;
};

export function HoldingCards({ holdings, totalValue }: HoldingCardsProps) {
  if (holdings.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-border/70 bg-card/40 px-8 py-16 text-center">
        <p className="text-lg font-semibold tracking-tight">No positions yet</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Buy virtual shares on the market. Prices move with Twelve Data — your
          cash stays simulated.
        </p>
        <Link
          href="/stocks"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-6 text-sm font-medium text-primary-foreground shadow-soft"
        >
          Open market
        </Link>
      </div>
    );
  }

  return (
    <Stagger className="space-y-3">
      {holdings.map((holding) => {
        const weight =
          totalValue > 0 ? (holding.marketValue / totalValue) * 100 : 0;
        const positive = holding.pnl >= 0;

        return (
          <StaggerItem key={holding.symbol}>
            <Link
              href={`/stocks/${holding.symbol}`}
              className="group block overflow-hidden rounded-[1.75rem] border border-border/50 bg-card/90 p-5 shadow-soft backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-glass active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-accent/20 text-sm font-semibold tracking-tight text-primary transition-transform duration-300 group-hover:scale-105">
                    {holding.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-base font-semibold tracking-tight">
                      {holding.symbol}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {holding.quantity} shares · avg{" "}
                      {formatCurrency(holding.averageCost)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-base font-semibold tracking-tight">
                    {formatCurrency(holding.marketValue)}
                  </p>
                  <p
                    className={cn(
                      "text-xs font-medium",
                      positive ? "text-success" : "text-destructive",
                    )}
                  >
                    {positive ? "+" : ""}
                    {formatCurrency(holding.pnl)} ({positive ? "+" : ""}
                    {holding.pnlPercent.toFixed(2)}%)
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Price {formatCurrency(holding.price)}</span>
                  <span>{weight.toFixed(1)}% of portfolio</span>
                </div>
                <MotionProgress
                  value={Math.min(100, Math.max(2, weight))}
                  className="h-1.5 rounded-full bg-secondary"
                  barClassName="rounded-full bg-gradient-to-r from-primary to-accent"
                />
              </div>
            </Link>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}
