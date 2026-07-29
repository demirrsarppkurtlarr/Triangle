"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CryptoActionState = { error?: string; success?: string };

function revalidate() {
  revalidatePath("/crypto");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
}

export async function buyCryptoAction(
  _prev: CryptoActionState,
  formData: FormData,
): Promise<CryptoActionState> {
  const symbol = formData.get("symbol")?.toString();
  const amount = Number(formData.get("amount"));
  if (!symbol || !amount || amount < 1) return { error: "Minimum $1" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("buy_crypto", {
    p_symbol: symbol,
    p_usd_amount: amount,
  });
  if (error) return { error: error.message };
  revalidate();
  return { success: "Kripto alındı" };
}

export async function sellCryptoAction(
  _prev: CryptoActionState,
  formData: FormData,
): Promise<CryptoActionState> {
  const symbol = formData.get("symbol")?.toString();
  const quantity = Number(formData.get("quantity"));
  if (!symbol || !quantity) return { error: "Geçersiz miktar" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("sell_crypto", {
    p_symbol: symbol,
    p_quantity: quantity,
  });
  if (error) return { error: error.message };
  revalidate();
  return { success: "Kripto satıldı" };
}

export async function tickCryptoAction(): Promise<CryptoActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("tick_crypto_prices");
  if (error) return { error: error.message };
  revalidatePath("/crypto");
  return { success: "Fiyatlar güncellendi" };
}
