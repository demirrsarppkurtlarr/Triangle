"use client";

import { useActionState, useEffect, useState } from "react";
import { Landmark, Timer } from "lucide-react";
import { toast } from "sonner";

import { MotionButton } from "@/components/motion/motion-button";
import {
  createDepositAction,
  withdrawDepositAction,
  type DepositActionState,
} from "@/features/deposits/actions/deposit.actions";
import type { TermDeposit } from "@/features/deposits/services/deposit.service";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";

const initial: DepositActionState = {};

const TERMS = [
  { days: 7, rate: 1, label: "7 gün · %1" },
  { days: 14, rate: 2.5, label: "14 gün · %2.5" },
  { days: 30, rate: 5, label: "30 gün · %5" },
  { days: 60, rate: 8, label: "60 gün · %8" },
  { days: 90, rate: 12, label: "90 gün · %12" },
];

type Props = { deposits: TermDeposit[]; cash: number };

export function DepositsHub({ deposits, cash }: Props) {
  const [createState, createAction, createPending] = useActionState(createDepositAction, initial);
  const [withdrawState, withdrawAction, withdrawPending] = useActionState(withdrawDepositAction, initial);
  const [amount, setAmount] = useState("500");
  const [term, setTerm] = useState("30");

  useEffect(() => {
    if (createState.error) toast.error(createState.error);
    if (createState.success) toast.success(createState.success);
    if (withdrawState.error) toast.error(withdrawState.error);
    if (withdrawState.success) toast.success(withdrawState.success);
  }, [createState, withdrawState]);

  const selectedTerm = TERMS.find((t) => t.days === Number(term));
  const maturity = selectedTerm
    ? Math.round(Number(amount) * (1 + selectedTerm.rate / 100) * 100) / 100
    : 0;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Bakiye: <span className="font-semibold text-foreground">{formatCurrency(cash)}</span>
      </p>

      <div className="rounded-[1.35rem] border border-border/50 bg-card/80 p-4 shadow-soft sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <Landmark className="size-4 text-primary" />
          <h2 className="font-semibold tracking-tight">Yeni vadeli mevduat</h2>
        </div>
        <form action={createAction} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-muted-foreground">Tutar ($)</label>
              <input
                type="number"
                name="amount"
                min={100}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border/60 bg-secondary/40 px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Vade</label>
              <select
                name="term_days"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border/60 bg-secondary/40 px-3 py-2.5 text-sm"
              >
                {TERMS.map((t) => (
                  <option key={t.days} value={t.days}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          {Number(amount) >= 100 && (
            <p className="text-xs text-muted-foreground">
              Vade sonunda: <span className="font-medium text-success">{formatCurrency(maturity)}</span>
              {" "}(+{formatCurrency(maturity - Number(amount))} getiri)
            </p>
          )}
          <MotionButton type="submit" className="min-h-11 w-full" pending={createPending} pendingLabel="Oluşturuluyor…">
            Mevduat oluştur
          </MotionButton>
        </form>
      </div>

      {deposits.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Timer className="size-4 text-primary" />
            <h2 className="font-semibold tracking-tight">Mevduatlarım</h2>
          </div>
          {deposits.map((d) => {
            const matured = new Date(d.maturesAt).getTime() <= Date.now();
            return (
              <div key={d.id} className={cn(
                "rounded-[1.35rem] border bg-card/80 p-4 shadow-soft",
                d.status === "active" ? "border-primary/20" : "border-border/50",
              )}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{formatCurrency(d.amount)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {d.termDays} gün · %{(d.interestRate * 100).toFixed(1)} · Vade: {formatCurrency(d.maturityAmount)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {matured ? "Vadesi doldu" : `Vade: ${new Date(d.maturesAt).toLocaleDateString("tr-TR")}`}
                    </p>
                  </div>
                  <span className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    d.status === "active" ? (matured ? "bg-success/10 text-success" : "bg-primary/10 text-primary") : "bg-secondary text-muted-foreground",
                  )}>
                    {d.status === "active" ? (matured ? "Hazır" : "Aktif") : d.status === "matured" ? "Çekildi" : "Erken çekildi"}
                  </span>
                </div>
                {d.status === "active" && (
                  <form action={withdrawAction} className="mt-3">
                    <input type="hidden" name="deposit_id" value={d.id} />
                    <MotionButton type="submit" size="sm" className="min-h-10 w-full" pending={withdrawPending} pendingLabel="Çekiliyor…"
                      variant={matured ? "default" : "outline"}>
                      {matured ? `Çek (${formatCurrency(d.maturityAmount)})` : `Erken çek (${formatCurrency(d.amount)})`}
                    </MotionButton>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
