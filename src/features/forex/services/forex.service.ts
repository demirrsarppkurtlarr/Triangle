import "server-only";

import { createClient } from "@/lib/supabase/server";

export type ForexPair = {
  pair: string;
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  prevRate: number;
  change: number;
};

export type ForexHolding = {
  currency: string;
  amount: number;
};

export async function getForexData(userId: string) {
  const supabase = await createClient();

  const [{ data: pairs }, { data: holdings }, { data: account }] =
    await Promise.all([
      supabase.from("forex_pairs").select("*"),
      supabase.from("forex_holdings").select("*").eq("user_id", userId),
      supabase.from("bank_accounts").select("balance").eq("user_id", userId).maybeSingle(),
    ]);

  return {
    pairs: (pairs ?? []).map((p) => ({
      pair: p.pair,
      baseCurrency: p.base_currency,
      quoteCurrency: p.quote_currency,
      rate: Number(p.rate),
      prevRate: Number(p.prev_rate),
      change: Number(p.rate) - Number(p.prev_rate),
    })),
    holdings: (holdings ?? []).map((h) => ({
      currency: h.currency,
      amount: Number(h.amount),
    })),
    cash: Number(account?.balance ?? 0),
  };
}
