"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

import { tradeSchema } from "@/features/stocks/schemas/trade.schemas";
import { syncMarketPrices } from "@/features/stocks/services/market.service";
import { createClient } from "@/lib/supabase/server";

export type StockActionState = {
  error?: string;
  success?: string;
};

function revalidateStockPaths(symbol?: string) {
  revalidatePath("/stocks");
  revalidatePath("/portfolio");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/notifications");
  if (symbol) revalidatePath(`/stocks/${symbol}`);
}

export async function refreshMarketPricesAction(): Promise<StockActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  try {
    const { synced } = await syncMarketPrices();
    revalidateStockPaths();
    return { success: `Updated ${synced} quotes from Twelve Data` };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to refresh prices",
    };
  }
}

export async function buyStockAction(
  _prev: StockActionState,
  formData: FormData,
): Promise<StockActionState> {
  const parsed = tradeSchema.safeParse({
    symbol: formData.get("symbol"),
    quantity: formData.get("quantity"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid trade" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  try {
    await syncMarketPrices();
  } catch {
    // Continue if DB has recent prices; RPC enforces freshness
  }

  const { error } = await supabase.rpc("buy_stock", {
    p_symbol: parsed.data.symbol,
    p_quantity: parsed.data.quantity,
    p_idempotency_key: randomUUID(),
  });

  if (error) return { error: error.message };

  revalidateStockPaths(parsed.data.symbol);
  return {
    success: `Bought ${parsed.data.quantity} ${parsed.data.symbol}`,
  };
}

export async function sellStockAction(
  _prev: StockActionState,
  formData: FormData,
): Promise<StockActionState> {
  const parsed = tradeSchema.safeParse({
    symbol: formData.get("symbol"),
    quantity: formData.get("quantity"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid trade" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  try {
    await syncMarketPrices();
  } catch {
    // Continue if DB has recent prices
  }

  const { error } = await supabase.rpc("sell_stock", {
    p_symbol: parsed.data.symbol,
    p_quantity: parsed.data.quantity,
    p_idempotency_key: randomUUID(),
  });

  if (error) return { error: error.message };

  revalidateStockPaths(parsed.data.symbol);
  return {
    success: `Sold ${parsed.data.quantity} ${parsed.data.symbol}`,
  };
}

export async function toggleFavoriteAction(symbol: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  const normalized = symbol.toUpperCase();

  const { data: existing } = await supabase
    .from("stock_favorites")
    .select("symbol")
    .eq("user_id", user.id)
    .eq("symbol", normalized)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("stock_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("symbol", normalized);
    if (error) return { success: false as const, error: error.message };
  } else {
    const { error } = await supabase.from("stock_favorites").insert({
      user_id: user.id,
      symbol: normalized,
    });
    if (error) return { success: false as const, error: error.message };
  }

  revalidatePath("/stocks");
  revalidatePath(`/stocks/${normalized}`);
  return { success: true as const };
}
