"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type EarnActionState = {
  error?: string;
  success?: string;
  amount?: number;
  win?: number;
  net?: number;
};

function revalidateEarn() {
  revalidatePath("/earn");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/notifications");
  revalidatePath("/portfolio");
}

export async function claimInterestAction(
  _prev: EarnActionState = {},
  _formData?: FormData,
): Promise<EarnActionState> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("claim_bank_interest");
  if (error) return { error: error.message };
  revalidateEarn();
  const amount = Number((data as { amount?: number })?.amount ?? 0);
  return { success: "interest", amount };
}

export async function claimRentAction(
  _prev: EarnActionState = {},
  _formData?: FormData,
): Promise<EarnActionState> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("claim_property_rent");
  if (error) return { error: error.message };
  revalidateEarn();
  const amount = Number((data as { amount?: number })?.amount ?? 0);
  return { success: "rent", amount };
}

export async function startJobAction(
  _prev: EarnActionState,
  formData: FormData,
): Promise<EarnActionState> {
  const jobId = formData.get("job_id")?.toString();
  if (!jobId) return { error: "Missing job" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("start_side_job", { p_job_id: jobId });
  if (error) return { error: error.message };
  revalidateEarn();
  return { success: "job_started" };
}

export async function claimJobAction(
  _prev: EarnActionState = {},
  _formData?: FormData,
): Promise<EarnActionState> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("claim_side_job");
  if (error) return { error: error.message };
  revalidateEarn();
  const amount = Number((data as { amount?: number })?.amount ?? 0);
  return { success: "job_claimed", amount };
}

export async function luckySpinAction(
  _prev: EarnActionState = {},
  _formData?: FormData,
): Promise<EarnActionState> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("play_lucky_spin");
  if (error) return { error: error.message };
  revalidateEarn();
  const row = (data ?? {}) as { win?: number; net?: number; cost?: number };
  return {
    success: "spin",
    win: Number(row.win ?? 0),
    net: Number(row.net ?? 0),
    amount: Number(row.win ?? 0),
  };
}

export async function claimQuestAction(
  _prev: EarnActionState,
  formData: FormData,
): Promise<EarnActionState> {
  const quest = formData.get("quest")?.toString();
  if (!quest) return { error: "Missing quest" };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("claim_quest_reward", {
    p_quest: quest,
  });
  if (error) return { error: error.message };
  revalidateEarn();
  const amount = Number((data as { amount?: number })?.amount ?? 0);
  return { success: "quest", amount };
}
