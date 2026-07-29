import "server-only";

import { createClient } from "@/lib/supabase/server";

export type Loan = {
  id: string;
  principal: number;
  interestRate: number;
  totalDue: number;
  amountPaid: number;
  installments: number;
  paidCount: number;
  status: string;
  dueAt: string;
  createdAt: string;
};

export type CreditScore = {
  score: number;
  loansTaken: number;
  loansRepaid: number;
  defaults: number;
};

export async function getLoansData(userId: string) {
  const supabase = await createClient();

  const [{ data: loans }, { data: creditScore }, { data: account }] =
    await Promise.all([
      supabase
        .from("loans")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("credit_scores")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("bank_accounts")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

  return {
    loans: (loans ?? []).map((l) => ({
      id: l.id,
      principal: Number(l.principal),
      interestRate: Number(l.interest_rate),
      totalDue: Number(l.total_due),
      amountPaid: Number(l.amount_paid),
      installments: l.installments,
      paidCount: l.paid_count,
      status: l.status,
      dueAt: l.due_at,
      createdAt: l.created_at,
    })),
    creditScore: creditScore
      ? {
          score: creditScore.score,
          loansTaken: creditScore.loans_taken,
          loansRepaid: creditScore.loans_repaid,
          defaults: creditScore.defaults,
        }
      : { score: 700, loansTaken: 0, loansRepaid: 0, defaults: 0 },
    cash: Number(account?.balance ?? 0),
  };
}
