"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type ShowcaseActionState = {
  error?: string;
  success?: string;
};

export async function equipShowcaseAction(
  _prev: ShowcaseActionState,
  formData: FormData,
): Promise<ShowcaseActionState> {
  const slot = formData.get("slot")?.toString();
  const itemIdRaw = formData.get("item_id")?.toString() ?? "";
  const itemId = itemIdRaw === "" || itemIdRaw === "none" ? null : itemIdRaw;

  if (!slot || !["vehicle", "property", "gadget", "collectible"].includes(slot)) {
    return { error: "Invalid slot" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.rpc("equip_showcase_item", {
    p_slot: slot,
    p_item_id: itemId,
  });

  if (error) return { error: error.message };

  revalidatePath("/inventory");
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: "ok" };
}
