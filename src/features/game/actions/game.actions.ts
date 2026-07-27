"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type GameActionState = {
  error?: string;
  success?: string;
};

function revalidateGamePaths() {
  revalidatePath("/shop");
  revalidatePath("/inventory");
  revalidatePath("/marketplace");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/notifications");
}

export async function buyGameItemAction(
  _prev: GameActionState,
  formData: FormData,
): Promise<GameActionState> {
  const itemId = formData.get("item_id")?.toString();
  const quantity = Number(formData.get("quantity") ?? 1);
  if (!itemId) return { error: "Missing item" };
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { error: "Invalid quantity" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.rpc("buy_game_item", {
    p_item_id: itemId,
    p_quantity: quantity,
  });
  if (error) return { error: error.message };

  revalidateGamePaths();
  return { success: "Purchased · check your inventory" };
}

export async function sellGameItemAction(
  _prev: GameActionState,
  formData: FormData,
): Promise<GameActionState> {
  const itemId = formData.get("item_id")?.toString();
  const quantity = Number(formData.get("quantity") ?? 1);
  if (!itemId) return { error: "Missing item" };
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { error: "Invalid quantity" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.rpc("sell_game_item", {
    p_item_id: itemId,
    p_quantity: quantity,
  });
  if (error) return { error: error.message };

  revalidateGamePaths();
  return { success: "Sold back to the shop" };
}

export async function listInventoryItemAction(
  _prev: GameActionState,
  formData: FormData,
): Promise<GameActionState> {
  const itemId = formData.get("item_id")?.toString();
  const quantity = Number(formData.get("quantity") ?? 1);
  const price = Number(formData.get("price"));
  if (!itemId) return { error: "Missing item" };
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { error: "Invalid quantity" };
  }
  if (!Number.isFinite(price) || price <= 0) {
    return { error: "Enter a positive price" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.rpc("list_inventory_item", {
    p_item_id: itemId,
    p_quantity: quantity,
    p_price: Math.round(price * 10000) / 10000,
  });
  if (error) return { error: error.message };

  revalidateGamePaths();
  return { success: "Listed on the marketplace" };
}

export async function cancelListingAction(
  _prev: GameActionState,
  formData: FormData,
): Promise<GameActionState> {
  const listingId = formData.get("listing_id")?.toString();
  if (!listingId) return { error: "Missing listing" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.rpc("cancel_item_listing", {
    p_listing_id: listingId,
  });
  if (error) return { error: error.message };

  revalidateGamePaths();
  return { success: "Listing cancelled · item returned" };
}

export async function buyListingAction(
  _prev: GameActionState,
  formData: FormData,
): Promise<GameActionState> {
  const listingId = formData.get("listing_id")?.toString();
  if (!listingId) return { error: "Missing listing" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.rpc("buy_item_listing", {
    p_listing_id: listingId,
  });
  if (error) return { error: error.message };

  revalidateGamePaths();
  return { success: "Purchase complete · item in inventory" };
}
