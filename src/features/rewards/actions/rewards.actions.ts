"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type RewardActionState = {
  error?: string;
  success?: string;
  amount?: number;
  streak?: number;
};

export async function claimDailyRewardAction(
  _prev: RewardActionState = {},
  _formData?: FormData,
): Promise<RewardActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase.rpc("claim_daily_reward");
  if (error) return { error: error.message };

  const row = (data ?? {}) as Record<string, unknown>;

  revalidatePath("/dashboard");
  revalidatePath("/rewards");
  revalidatePath("/transactions");
  revalidatePath("/notifications");

  return {
    success: "claimed",
    amount: Number(row.amount ?? 0),
    streak: Number(row.streak ?? 0),
  };
}
