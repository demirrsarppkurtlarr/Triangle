"use client";

import { useActionState, useEffect, useState } from "react";
import { ArrowDownUp, DollarSign } from "lucide-react";
import { toast } from "sonner";

import { MotionButton } from "@/components/motion/motion-button";
import {
  buyForexAction,
  sellForexAction,
  type ForexActionState,
} from "@/features/forex/actions/forex.actions";
import type { ForexPair, ForexHolding } from "@/features/forex/services/forex.service";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";

const initial: ForexActionState = {};

type Props = { pairs: ForexPair[]; holdings: ForexHolding[]; cash: number };

export function ForexHub({ pairs, holdings, cash }: Props) {
  const [buyState, buyAction, buyPending] = useActionState(buyForexAction, initial);
  const [sellState, sellAction, sellPending] = useActionState(sellForexAction, initial);
  const [selectedPair, setSelectedPair] = useState(pairs[0]?.pair ?? "");
  const [amount, setAmount] = useState("100");

  useEffect(() => {
    for (const s of [buyState, sellState]) {
      if (s.error) toast.error(s.error);
      if (s.success) toast.success(s.success);
    }
  }, [buyState, sellState]);

  const holdingsMap = new Map(holdings.map((h) => [h.currency, h.amount]));

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Bakiye: <span className="font-semibold text-foreground">{formatCurrency(cash)}</span>
      </p>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {pairs.map((p) => {
          const pct = p.prevRate > 0 ? ((p.rate - p.prevRate) / p.prevRate) * 100 : 0;
          return (
            <button
              key={p.pair}
              type="button"
              onClick={() => setSelectedPair(p.pair)}
              className={cn(
                "rounded-[1.35rem] border bg-card/80 p-3 text-left shadow-soft transition-all",
                selectedPair === p.pair ? "border-primary/40 ring-1 ring-primary/20" : "border-border/50",
              )}
            >
              <p className="text-sm font-semibold">{p.pair}</p>
              <p className="mt-1 text-lg font-semibold tracking-tight">{p.rate.toFixed(4)}</p>
              <p className={cn("text-xs", pct >= 0 ? "text-success" : "text-destructive")}>
                {pct >= 0 ? "+" : ""}{pct.toFixed(3)}%
              </p>
            </button>
          );
        })}
      </div>

      <div className="rounded-[1.35rem] border border-border/50 bg-card/80 p-4 shadow-soft sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <ArrowDownUp className="size-4 text-primary" />
          <h2 className="font-semibold tracking-tight">İşlem yap</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <form action={buyAction} className="space-y-2">
            <input type="hidden" name="pair" value={selectedPair} />
            <input
              type="number"
              name="amount"
              min={10}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="USD tutarı"
              className="w-full rounded-xl border border-border/60 bg-secondary/40 px-3 py-2.5 text-sm"
            />
            <MotionButton type="submit" className="min-h-10 w-full" pending={buyPending} pendingLabel="Alınıyor…">
              Al ({selectedPair})
            </MotionButton>
          </form>
          <form action={sellAction} className="space-y-2">
            <input type="hidden" name="pair" value={selectedPair} />
            <input
              type="number"
              name="amount"
              min={1}
              step="0.01"
              placeholder="Döviz miktarı"
              className="w-full rounded-xl border border-border/60 bg-secondary/40 px-3 py-2.5 text-sm"
            />
            <MotionButton type="submit" variant="outline" className="min-h-10 w-full" pending={sellPending} pendingLabel="Satılıyor…">
              Sat ({selectedPair})
            </MotionButton>
          </form>
        </div>
      </div>

      {holdings.length > 0 && (
        <div className="rounded-[1.35rem] border border-border/50 bg-card/80 p-4 shadow-soft sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <DollarSign className="size-4 text-primary" />
            <h2 className="font-semibold tracking-tight">Döviz portföyüm</h2>
          </div>
          <div className="space-y-2">
            {holdings.map((h) => (
              <div key={h.currency} className="flex items-center justify-between rounded-xl border border-border/50 px-3 py-2.5">
                <span className="text-sm font-medium">{h.currency}</span>
                <span className="text-sm font-semibold">{h.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
