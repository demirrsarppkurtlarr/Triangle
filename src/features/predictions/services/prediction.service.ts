import "server-only";

import { createClient } from "@/lib/supabase/server";

export type Prediction = {
  id: string;
  symbol: string;
  questionEn: string;
  questionTr: string;
  snapshotPrice: number;
  resolvesAt: string;
  resolved: boolean;
  outcome: string | null;
};

export type PredictionBet = {
  id: string;
  predictionId: string;
  betDirection: string;
  amount: number;
  payout: number | null;
  status: string;
};

export async function getPredictionsData(userId: string) {
  const supabase = await createClient();

  const [{ data: predictions }, { data: bets }, { data: account }] =
    await Promise.all([
      supabase
        .from("predictions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("prediction_bets")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase.from("bank_accounts").select("balance").eq("user_id", userId).maybeSingle(),
    ]);

  return {
    predictions: (predictions ?? []).map((p) => ({
      id: p.id,
      symbol: p.symbol,
      questionEn: p.question_en,
      questionTr: p.question_tr,
      snapshotPrice: Number(p.snapshot_price),
      resolvesAt: p.resolves_at,
      resolved: p.resolved,
      outcome: p.outcome,
    })),
    bets: (bets ?? []).map((b) => ({
      id: b.id,
      predictionId: b.prediction_id,
      betDirection: b.bet_direction,
      amount: Number(b.amount),
      payout: b.payout ? Number(b.payout) : null,
      status: b.status,
    })),
    cash: Number(account?.balance ?? 0),
  };
}
