"use client";

import { useActionState, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Target } from "lucide-react";
import { toast } from "sonner";

import { MotionButton } from "@/components/motion/motion-button";
import {
  placeBetAction,
  spawnPredictionAction,
  resolveAction,
  type PredictionActionState,
} from "@/features/predictions/actions/prediction.actions";
import type { Prediction, PredictionBet } from "@/features/predictions/services/prediction.service";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";

const initial: PredictionActionState = {};

type Props = { predictions: Prediction[]; bets: PredictionBet[]; cash: number };

export function PredictionsHub({ predictions, bets, cash }: Props) {
  const [betState, betAction, betPending] = useActionState(placeBetAction, initial);
  const [betAmount, setBetAmount] = useState("50");

  useEffect(() => {
    if (betState.error) toast.error(betState.error);
    if (betState.success) toast.success(betState.success);
  }, [betState]);

  useEffect(() => {
    spawnPredictionAction();
    resolveAction();
  }, []);

  const betMap = new Map(bets.map((b) => [b.predictionId, b]));
  const activePredictions = predictions.filter((p) => !p.resolved);
  const resolvedPredictions = predictions.filter((p) => p.resolved);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Bakiye: <span className="font-semibold text-foreground">{formatCurrency(cash)}</span>
        {" · "}Bahis: $10 — $5,000
      </p>

      {activePredictions.length === 0 && (
        <div className="rounded-[1.35rem] border border-dashed border-border/70 bg-card/50 px-6 py-10 text-center">
          <Target className="mx-auto size-6 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">Aktif tahmin yok</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Yeni tahminler otomatik oluşturulur. Kısa süre sonra tekrar kontrol et.
          </p>
        </div>
      )}

      {activePredictions.map((pred) => {
        const existing = betMap.get(pred.id);
        const timeLeft = Math.max(0, Math.round((new Date(pred.resolvesAt).getTime() - Date.now()) / 1000));
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;

        return (
          <div key={pred.id} className="rounded-[1.35rem] border border-primary/20 bg-card/80 p-4 shadow-soft sm:p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{pred.symbol}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{pred.questionTr}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Anlık fiyat: {formatCurrency(pred.snapshotPrice)} · Kalan: {minutes}:{String(seconds).padStart(2, "0")}
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                Aktif
              </span>
            </div>

            {existing ? (
              <div className="rounded-xl border border-border/50 bg-secondary/40 px-3 py-2.5 text-sm">
                Bahsin: <span className="font-semibold">{existing.betDirection === "up" ? "Yükselir" : "Düşer"}</span>
                {" · "}{formatCurrency(existing.amount)}
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="number"
                  min={10}
                  max={5000}
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-secondary/40 px-3 py-2.5 text-sm"
                  placeholder="Bahis tutarı ($)"
                />
                <div className="grid grid-cols-2 gap-2">
                  <form action={betAction}>
                    <input type="hidden" name="prediction_id" value={pred.id} />
                    <input type="hidden" name="direction" value="up" />
                    <input type="hidden" name="amount" value={betAmount} />
                    <MotionButton type="submit" className="min-h-10 w-full gap-1.5" pending={betPending} pendingLabel="…">
                      <ArrowUp className="size-4" /> Yükselir
                    </MotionButton>
                  </form>
                  <form action={betAction}>
                    <input type="hidden" name="prediction_id" value={pred.id} />
                    <input type="hidden" name="direction" value="down" />
                    <input type="hidden" name="amount" value={betAmount} />
                    <MotionButton type="submit" variant="outline" className="min-h-10 w-full gap-1.5" pending={betPending} pendingLabel="…">
                      <ArrowDown className="size-4" /> Düşer
                    </MotionButton>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {resolvedPredictions.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold tracking-tight">Geçmiş tahminler</h2>
          {resolvedPredictions.slice(0, 10).map((pred) => {
            const bet = betMap.get(pred.id);
            return (
              <div key={pred.id} className="rounded-[1.35rem] border border-border/50 bg-card/80 p-3 shadow-soft">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{pred.symbol}</p>
                    <p className="text-xs text-muted-foreground">
                      Sonuç: <span className="font-medium">{pred.outcome === "up" ? "Yükseldi" : "Düştü"}</span>
                    </p>
                  </div>
                  {bet && (
                    <span className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      bet.status === "won" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
                    )}>
                      {bet.status === "won" ? `+${formatCurrency(bet.payout ?? 0)}` : `-${formatCurrency(bet.amount)}`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
