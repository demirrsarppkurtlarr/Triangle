"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { MotionProgress } from "@/components/motion/motion-progress";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { sellStockAction } from "@/features/stocks/actions/stock.actions";
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
          Buy virtual shares on the market. Prices move with the simulated tick —
          your cash and holdings stay in TriangleBank.
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
      {holdings.map((holding) => (
        <StaggerItem key={holding.symbol}>
          <HoldingCard holding={holding} totalValue={totalValue} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}

function HoldingCard({
  holding,
  totalValue,
}: {
  holding: PortfolioHolding;
  totalValue: number;
}) {
  const router = useRouter();
  const [pendingMode, setPendingMode] = useState<"one" | "all" | null>(null);
  const [isPending, startTransition] = useTransition();
  const weight = totalValue > 0 ? (holding.marketValue / totalValue) * 100 : 0;
  const positive = holding.pnl >= 0;
  const canSellOne = holding.quantity >= 1;
  const sellOneQty = canSellOne ? 1 : Number(holding.quantity.toFixed(4));

  useEffect(() => {
    if (!isPending) setPendingMode(null);
  }, [isPending]);

  function sell(mode: "one" | "all") {
    const quantity =
      mode === "all"
        ? Number(holding.quantity.toFixed(4))
        : sellOneQty;

    if (!(quantity > 0)) {
      toast.error("Nothing to sell");
      return;
    }

    setPendingMode(mode);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("symbol", holding.symbol);
      formData.set("quantity", String(quantity));
      const result = await sellStockAction({}, formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result.success ?? `Sold ${quantity} ${holding.symbol}`);
      router.refresh();
    });
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border/50 bg-card/90 p-4 shadow-soft backdrop-blur-xl sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <Link
          href={`/stocks/${holding.symbol}`}
          prefetch
          className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl outline-none transition-colors hover:opacity-90 active:scale-[0.99]"
        >
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-accent/20 text-sm font-semibold tracking-tight text-primary">
            {holding.symbol.slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold tracking-tight">
              {holding.symbol}
            </p>
            <p className="text-xs text-muted-foreground">
              {holding.quantity} hisse · maliyet{" "}
              {formatCurrency(holding.averageCost)} · şimdi{" "}
              {formatCurrency(holding.price)}
            </p>
          </div>
        </Link>

        <div className="shrink-0 text-right">
          <p className="text-base font-semibold tracking-tight tabular-nums">
            {formatCurrency(holding.marketValue)}
          </p>
          <p
            className={cn(
              "text-xs font-medium tabular-nums",
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

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={isPending || !(sellOneQty > 0)}
          onClick={() => sell("one")}
          className={cn(
            "inline-flex min-h-11 items-center justify-center rounded-2xl border border-border/70 bg-background px-3 text-sm font-semibold transition-colors active:scale-[0.98]",
            "hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {pendingMode === "one" && isPending
            ? "Selling…"
            : canSellOne
              ? "Sell 1"
              : "Sell rest"}
        </button>
        <button
          type="button"
          disabled={isPending || !(holding.quantity > 0)}
          onClick={() => sell("all")}
          className={cn(
            "inline-flex min-h-11 items-center justify-center rounded-2xl bg-destructive px-3 text-sm font-semibold text-destructive-foreground transition-colors active:scale-[0.98]",
            "hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {pendingMode === "all" && isPending ? "Selling…" : "Sell all"}
        </button>
      </div>
    </div>
  );
}
