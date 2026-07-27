"use client";

import { useMemo } from "react";

import { AllocationBars } from "@/features/portfolio/components/allocation-bars";
import { HoldingCards } from "@/features/portfolio/components/holding-cards";
import { PortfolioHero } from "@/features/portfolio/components/portfolio-hero";
import { RecentTrades } from "@/features/portfolio/components/recent-trades";
import type {
  PortfolioSummary,
  TradeHistoryItem,
} from "@/features/portfolio/services/portfolio.service";
import { MarketAutoTick } from "@/features/stocks/components/market-auto-tick";
import { useLivePrices } from "@/features/stocks/hooks/use-live-market";
import type { PortfolioHolding } from "@/features/stocks/services/market.service";

type LivePortfolioViewProps = {
  summary: PortfolioSummary;
  holdings: PortfolioHolding[];
  trades: TradeHistoryItem[];
};

export function LivePortfolioView({
  summary,
  holdings,
  trades,
}: LivePortfolioViewProps) {
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
    return holdings
      .map((h) => {
        const price = livePrices[h.symbol] ?? h.price;
        const marketValue = h.quantity * price;
        const costBasis = h.costBasis;
        const pnl = marketValue - costBasis;
        const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
        return {
          ...h,
          price,
          marketValue,
          pnl,
          pnlPercent,
        };
      })
      .sort((a, b) => b.marketValue - a.marketValue);
  }, [holdings, livePrices]);

  const totalValue = liveHoldings.reduce((sum, h) => sum + h.marketValue, 0);
  const totalCost = summary.totalCost;
  const totalPnl = totalValue - totalCost;
  const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  const dayWeight =
    totalValue + summary.cashBalance > 0
      ? (totalValue / (totalValue + summary.cashBalance)) * 100
      : 0;

  const liveSummary: PortfolioSummary = {
    ...summary,
    totalValue,
    totalPnl,
    totalPnlPercent,
    dayWeight,
  };

  return (
    <div className="space-y-8">
      <MarketAutoTick />
      <PortfolioHero summary={liveSummary} />

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Holdings</h2>
            <p className="text-sm text-muted-foreground">
              Live simulated value · average cost basis
            </p>
          </div>
          <HoldingCards holdings={liveHoldings} totalValue={totalValue} />
        </div>

        <div className="space-y-6 lg:col-span-2">
          <AllocationBars holdings={liveHoldings} totalValue={totalValue} />
          <RecentTrades trades={trades} />
        </div>
      </div>
    </div>
  );
}
