"use client";

import { useActionState, useEffect, useState } from "react";
import { Bitcoin, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { MotionButton } from "@/components/motion/motion-button";
import {
  buyCryptoAction,
  sellCryptoAction,
  type CryptoActionState,
} from "@/features/crypto/actions/crypto.actions";
import type { CryptoAsset, CryptoHolding } from "@/features/crypto/services/crypto.service";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";

const initial: CryptoActionState = {};

type Props = { assets: CryptoAsset[]; holdings: CryptoHolding[]; cash: number };

export function CryptoHub({ assets, holdings, cash }: Props) {
  const [buyState, buyAction, buyPending] = useActionState(buyCryptoAction, initial);
  const [sellState, sellAction, sellPending] = useActionState(sellCryptoAction, initial);
  const [selected, setSelected] = useState(assets[0]?.symbol ?? "");
  const [buyAmount, setBuyAmount] = useState("50");

  useEffect(() => {
    for (const s of [buyState, sellState]) {
      if (s.error) toast.error(s.error);
      if (s.success) toast.success(s.success);
    }
  }, [buyState, sellState]);

  const holdingMap = new Map(holdings.map((h) => [h.symbol, h]));

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Bakiye: <span className="font-semibold text-foreground">{formatCurrency(cash)}</span>
      </p>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {assets.map((a) => (
          <button
            key={a.symbol}
            type="button"
            onClick={() => setSelected(a.symbol)}
            className={cn(
              "rounded-[1.35rem] border bg-card/80 p-3.5 text-left shadow-soft transition-all",
              selected === a.symbol ? "border-primary/40 ring-1 ring-primary/20" : "border-border/50",
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{a.symbol}</p>
              {a.changePct >= 0 ? (
                <TrendingUp className="size-3.5 text-success" />
              ) : (
                <TrendingDown className="size-3.5 text-destructive" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">{a.name}</p>
            <p className="mt-2 text-lg font-semibold tracking-tight">{formatCurrency(a.price)}</p>
            <p className={cn("text-xs", a.changePct >= 0 ? "text-success" : "text-destructive")}>
              {a.changePct >= 0 ? "+" : ""}{a.changePct.toFixed(2)}%
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Volatilite: {(a.volatility * 100).toFixed(1)}%
            </p>
          </button>
        ))}
      </div>

      <div className="rounded-[1.35rem] border border-border/50 bg-card/80 p-4 shadow-soft sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <Bitcoin className="size-4 text-primary" />
          <h2 className="font-semibold tracking-tight">{selected} al/sat</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <form action={buyAction} className="space-y-2">
            <input type="hidden" name="symbol" value={selected} />
            <input
              type="number"
              name="amount"
              min={1}
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              placeholder="USD tutarı"
              className="w-full rounded-xl border border-border/60 bg-secondary/40 px-3 py-2.5 text-sm"
            />
            <MotionButton type="submit" className="min-h-10 w-full" pending={buyPending} pendingLabel="Alınıyor…">
              Al ({selected})
            </MotionButton>
          </form>
          <form action={sellAction} className="space-y-2">
            <input type="hidden" name="symbol" value={selected} />
            <input
              type="number"
              name="quantity"
              min={0.00000001}
              step="0.00000001"
              placeholder="Miktar"
              className="w-full rounded-xl border border-border/60 bg-secondary/40 px-3 py-2.5 text-sm"
            />
            <MotionButton type="submit" variant="outline" className="min-h-10 w-full" pending={sellPending} pendingLabel="Satılıyor…">
              Sat ({selected})
            </MotionButton>
          </form>
        </div>
      </div>

      {holdings.length > 0 && (
        <div className="rounded-[1.35rem] border border-border/50 bg-card/80 p-4 shadow-soft sm:p-5">
          <h2 className="mb-3 font-semibold tracking-tight">Kripto portföyüm</h2>
          <div className="space-y-2">
            {holdings.map((h) => (
              <div key={h.symbol} className="flex items-center justify-between rounded-xl border border-border/50 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">{h.symbol}</p>
                  <p className="text-xs text-muted-foreground">{h.quantity.toFixed(6)} adet</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(h.currentValue)}</p>
                  <p className={cn("text-xs", h.pnl >= 0 ? "text-success" : "text-destructive")}>
                    {h.pnl >= 0 ? "+" : ""}{formatCurrency(h.pnl)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
