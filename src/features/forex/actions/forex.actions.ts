"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ForexActionState = { error?: string; success?: string };

function revalidate() {
  revalidatePath("/forex");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
}

export async function buyForexAction(
  _prev: ForexActionState,
  formData: FormData,
): Promise<ForexActionState> {
  const pair = formData.get("pair")?.toString();
  const amount = Number(formData.get("amount"));
  if (!pair || !amount || amount < 10) return { error: "Minimum $10" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("buy_forex", {
    p_pair: pair,
    p_usd_amount: amount,
  });
  if (error) return { error: error.message };
  revalidate();
  return { success: "Döviz alındı" };
}

export async function sellForexAction(
  _prev: ForexActionState,
  formData: FormData,
): Promise<ForexActionState> {
  const pair = formData.get("pair")?.toString();
  const amount = Number(formData.get("amount"));
  if (!pair || !amount) return { error: "Geçersiz tutar" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("sell_forex", {
    p_pair: pair,
    p_currency_amount: amount,
  });
  if (error) return { error: error.message };
  revalidate();
  return { success: "Döviz satıldı" };
}

export async function tickForexAction(): Promise<ForexActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("tick_forex_rates");
  if (error) return { error: error.message };
  revalidatePath("/forex");
  return { success: "Kurlar güncellendi" };
}
