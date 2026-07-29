"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DepositActionState = { error?: string; success?: string };

function revalidate() {
  revalidatePath("/deposits");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
}

export async function createDepositAction(
  _prev: DepositActionState,
  formData: FormData,
): Promise<DepositActionState> {
  const amount = Number(formData.get("amount"));
  const termDays = Number(formData.get("term_days") || 30);
  if (!amount || amount < 100) return { error: "Minimum $100" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_term_deposit", {
    p_amount: amount,
    p_term_days: termDays,
  });
  if (error) return { error: error.message };
  revalidate();
  return { success: "Vadeli mevduat oluşturuldu" };
}

export async function withdrawDepositAction(
  _prev: DepositActionState,
  formData: FormData,
): Promise<DepositActionState> {
  const depositId = formData.get("deposit_id")?.toString();
  if (!depositId) return { error: "Missing deposit" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("withdraw_term_deposit", {
    p_deposit_id: depositId,
  });
  if (error) return { error: error.message };
  revalidate();
  return { success: "Mevduat çekildi" };
}
