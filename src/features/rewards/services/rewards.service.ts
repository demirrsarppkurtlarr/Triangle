import "server-only";

import { createClient } from "@/lib/supabase/server";

export type DailyRewardStatus = {
  claimedToday: boolean;
  streak: number;
  nextStreak: number;
  amount: number;
  base: number;
  bonus: number;
  maxStreak: number;
  claimDate: string;
};

export async function getDailyRewardStatus(): Promise<DailyRewardStatus | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_daily_reward_status");
  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  return {
    claimedToday: Boolean(row.claimed_today),
    streak: Number(row.streak ?? 0),
    nextStreak: Number(row.next_streak ?? 1),
    amount: Number(row.amount ?? 50),
    base: Number(row.base ?? 50),
    bonus: Number(row.bonus ?? 10),
    maxStreak: Number(row.max_streak ?? 7),
    claimDate: String(row.claim_date ?? ""),
  };
}
