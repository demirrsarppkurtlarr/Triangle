"use client";

import { useActionState, useEffect, useState } from "react";
import { CreditCard, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { MotionButton } from "@/components/motion/motion-button";
import {
  takeLoanAction,
  repayLoanAction,
  type LoanActionState,
} from "@/features/loans/actions/loan.actions";
import type {
  CreditScore,
  Loan,
} from "@/features/loans/services/loan.service";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";

const initial: LoanActionState = {};

type Props = {
  loans: Loan[];
  creditScore: CreditScore;
  cash: number;
};

export function LoansHub({ loans, creditScore, cash }: Props) {
  const [takeState, takeAction, takePending] = useActionState(takeLoanAction, initial);
  const [repayState, repayAction, repayPending] = useActionState(repayLoanAction, initial);
  const [amount, setAmount] = useState("1000");
  const [installments, setInstallments] = useState("5");

  useEffect(() => {
    if (takeState.error) toast.error(takeState.error);
    if (takeState.success) toast.success(takeState.success);
    if (repayState.error) toast.error(repayState.error);
    if (repayState.success) toast.success(repayState.success);
  }, [takeState, repayState]);

  const activeLoans = loans.filter((l) => l.status === "active");
  const scoreColor =
    creditScore.score >= 750
      ? "text-success"
      : creditScore.score >= 600
        ? "text-yellow-500"
        : "text-destructive";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Kredi Skoru" value={String(creditScore.score)} className={scoreColor} />
        <Stat label="Bakiye" value={formatCurrency(cash)} />
        <Stat label="Aktif Kredi" value={String(activeLoans.length)} />
      </div>

      <div className="rounded-[1.35rem] border border-border/50 bg-card/80 p-4 shadow-soft sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <CreditCard className="size-4 text-primary" />
          <h2 className="font-semibold tracking-tight">Yeni kredi</h2>
        </div>
        <form action={takeAction} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-muted-foreground">Tutar ($)</label>
              <input
                type="number"
                name="amount"
                min={100}
                max={50000}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border/60 bg-secondary/40 px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Taksit sayısı</label>
              <select
                name="installments"
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border/60 bg-secondary/40 px-3 py-2.5 text-sm"
              >
                {[1, 2, 3, 5, 7, 10].map((n) => (
                  <option key={n} value={n}>{n} taksit</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Faiz: {creditScore.score >= 800 ? "%3" : creditScore.score >= 700 ? "%5" : creditScore.score >= 600 ? "%8" : "%12"}
            {" · "}Maks: {formatCurrency(creditScore.score >= 800 ? 50000 : creditScore.score >= 700 ? 20000 : creditScore.score >= 600 ? 10000 : creditScore.score >= 500 ? 5000 : 1000)}
          </p>
          <MotionButton type="submit" className="min-h-11 w-full" pending={takePending} pendingLabel="İşleniyor…"
            disabled={activeLoans.length >= 3}>
            {activeLoans.length >= 3 ? "Maksimum 3 aktif kredi" : "Kredi çek"}
          </MotionButton>
        </form>
      </div>

      {loans.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" />
            <h2 className="font-semibold tracking-tight">Kredilerim</h2>
          </div>
          {loans.map((loan) => (
            <div
              key={loan.id}
              className={cn(
                "rounded-[1.35rem] border bg-card/80 p-4 shadow-soft",
                loan.status === "active" ? "border-primary/20" : "border-border/50",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">
                    {formatCurrency(loan.principal)}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      %{(loan.interestRate * 100).toFixed(0)} faiz
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ödenen: {formatCurrency(loan.amountPaid)} / {formatCurrency(loan.totalDue)}
                    {" · "}{loan.paidCount}/{loan.installments} taksit
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    loan.status === "active" ? "bg-primary/10 text-primary" : "bg-success/10 text-success",
                  )}
                >
                  {loan.status === "active" ? "Aktif" : loan.status === "paid" ? "Ödendi" : "Temerrüt"}
                </span>
              </div>
              {loan.status === "active" && (
                <form action={repayAction} className="mt-3">
                  <input type="hidden" name="loan_id" value={loan.id} />
                  <MotionButton
                    type="submit"
                    size="sm"
                    className="min-h-10 w-full"
                    pending={repayPending}
                    pendingLabel="Ödeniyor…"
                  >
                    Taksit öde ({formatCurrency(
                      Math.round(((loan.totalDue - loan.amountPaid) / Math.max(loan.installments - loan.paidCount, 1)) * 100) / 100
                    )})
                  </MotionButton>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-[1.35rem] border border-border/50 bg-card/80 p-4 text-center shadow-soft">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold tracking-tight", className)}>{value}</p>
    </div>
  );
}
