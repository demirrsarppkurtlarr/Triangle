"use server";

import { revalidatePath } from "next/cache";

import { syncMarketPrices } from "@/features/stocks/services/market.service";
import { createClient } from "@/lib/supabase/server";
import type { StockActionState } from "@/features/stocks/actions/stock.actions";

export async function refreshMarketPricesFormAction(
  _prev: StockActionState,
  formData: FormData,
): Promise<StockActionState> {
  void _prev;
  void formData;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  try {
    const { synced } = await syncMarketPrices();
    revalidatePath("/stocks");
    revalidatePath("/portfolio");
    revalidatePath("/dashboard");
    return { success: `Updated ${synced} quotes from Twelve Data` };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to refresh prices",
    };
  }
}
