"use client";

import { useState } from "react";

import { MarketAutoTick } from "@/features/stocks/components/market-auto-tick";
import { StockChart } from "@/features/stocks/components/stock-chart";
import { TradeForm } from "@/features/stocks/components/trade-form";
import {
  COMPARISON_PERIOD_LABELS,
  useComparisonBaseline,
  type ComparisonPeriod,
  type ServerBaselines,
} from "@/features/stocks/hooks/use-comparison-baseline";
import { useLiveQuote } from "@/features/stocks/hooks/use-live-market";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";

type StockDetailLiveProps = {
  symbol: string;
  name: string;
  basePrice: number;
  marketLabel: string;
  recordedAt: string | null;
  chartData: { datetime: string; close: number }[];
  availableCash: number;
  holding: { quantity: number; averageCost: number } | null;
  baselines: ServerBaselines;
};

const PERIODS: ComparisonPeriod[] = ["day", "week", "month"];

export function StockDetailLive({
  symbol,
  basePrice,
  marketLabel,
  recordedAt,
  chartData,
  availableCash,
  holding,
  baselines,
}: StockDetailLiveProps) {
  const [period, setPeriod] = useState<ComparisonPeriod>("day");
  const quote = useLiveQuote(basePrice);
  const cmp = useComparisonBaseline(symbol, quote.price, baselines, period);
  const up = cmp.changePercent >= 0;

  return (
    <div className="space-y-8">
      <MarketAutoTick />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-4xl font-semibold tracking-tight tabular-nums">
            {basePrice > 0 ? formatCurrency(quote.price) : "—"}
          </p>
          <p
            className={cn(
              "mt-1 text-sm font-medium tabular-nums",
              up ? "text-success" : "text-destructive",
            )}
          >
            {up ? "+" : ""}
            {cmp.changeAmount.toFixed(2)} ({up ? "+" : ""}
            {cmp.changePercent.toFixed(2)}%)
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {cmp.label.full} · baz {formatCurrency(cmp.baseline)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {marketLabel}
            {recordedAt
              ? ` · Server ${new Date(recordedAt).toLocaleTimeString("tr-TR", { timeZone: "Europe/Istanbul" })}`
              : ""}
          </p>

          <div className="mt-3 inline-flex rounded-2xl border border-border/60 bg-secondary/50 p-1">
            {PERIODS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setPeriod(key)}
                className={cn(
                  "min-h-9 rounded-xl px-3.5 text-sm font-medium transition-colors active:scale-[0.98]",
                  period === key
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {COMPARISON_PERIOD_LABELS[key].short}
              </button>
            ))}
          </div>
        </div>

        {holding && (
          <div className="rounded-2xl bg-secondary/70 px-4 py-3 text-sm">
            <p className="text-muted-foreground">You own</p>
            <p className="font-semibold">
              {holding.quantity} shares · avg{" "}
              {formatCurrency(holding.averageCost)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Live value {formatCurrency(holding.quantity * quote.price)}
            </p>
          </div>
        )}
      </div>

      <StockChart data={chartData} symbol={symbol} livePrice={quote.price} />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle>Buy</CardTitle>
            <CardDescription>
              Virtual purchase · cash deducted from your TriangleBank balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TradeForm
              symbol={symbol}
              price={quote.price}
              availableCash={availableCash}
              ownedQuantity={holding?.quantity ?? 0}
              side="buy"
            />
          </CardContent>
        </Card>

        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle>Sell</CardTitle>
            <CardDescription>
              Virtual sale · proceeds credited to your balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TradeForm
              symbol={symbol}
              price={quote.price}
              availableCash={availableCash}
              ownedQuantity={holding?.quantity ?? 0}
              side="sell"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
