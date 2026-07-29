import "server-only";

import { createClient } from "@/lib/supabase/server";

export type InsurancePolicy = {
  id: string;
  policyType: string;
  coverageAmount: number;
  premium: number;
  status: string;
  expiresAt: string;
  createdAt: string;
};

export async function getInsuranceData(userId: string) {
  const supabase = await createClient();

  const [{ data: policies }, { data: account }] = await Promise.all([
    supabase
      .from("insurance_policies")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase.from("bank_accounts").select("balance").eq("user_id", userId).maybeSingle(),
  ]);

  return {
    policies: (policies ?? []).map((p) => ({
      id: p.id,
      policyType: p.policy_type,
      coverageAmount: Number(p.coverage_amount),
      premium: Number(p.premium),
      status: p.status,
      expiresAt: p.expires_at,
      createdAt: p.created_at,
    })),
    cash: Number(account?.balance ?? 0),
  };
}
