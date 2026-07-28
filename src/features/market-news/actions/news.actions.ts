"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type NewsActionState = {
  error?: string;
  success?: string;
};

export async function applyMarketNewsAction(
  _prev: NewsActionState = {},
  _formData?: FormData,
): Promise<NewsActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  await supabase.rpc("spawn_market_news");
  const { error } = await supabase.rpc("apply_market_news");
  if (error) return { error: error.message };

  revalidatePath("/stocks");
  revalidatePath("/news");
  revalidatePath("/portfolio");
  return { success: "applied" };
}

/** Quiet spawn used by the 10s global market tick. */
export async function spawnMarketNewsSilentAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.rpc("spawn_market_news");
  await supabase.rpc("apply_market_news");
}
