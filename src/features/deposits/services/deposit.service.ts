import "server-only";

import { createClient } from "@/lib/supabase/server";

export type TermDeposit = {
  id: string;
  amount: number;
  interestRate: number;
  termDays: number;
  maturityAmount: number;
  status: string;
  maturesAt: string;
  createdAt: string;
};

export async function getDepositsData(userId: string) {
  const supabase = await createClient();

  const [{ data: deposits }, { data: account }] = await Promise.all([
    supabase
      .from("term_deposits")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("bank_accounts")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  return {
    deposits: (deposits ?? []).map((d) => ({
      id: d.id,
      amount: Number(d.amount),
      interestRate: Number(d.interest_rate),
      termDays: d.term_days,
      maturityAmount: Number(d.maturity_amount),
      status: d.status,
      maturesAt: d.matures_at,
      createdAt: d.created_at,
    })),
    cash: Number(account?.balance ?? 0),
  };
}
