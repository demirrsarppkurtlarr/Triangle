"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/features/admin/services/admin-auth.service";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export type AdminEconomyActionState = {
  error?: string;
  success?: string;
};

function revalidateEconomy() {
  revalidatePath("/admin/economy");
  revalidatePath("/rewards");
  revalidatePath("/shop");
  revalidatePath("/marketplace");
  revalidatePath("/news");
  revalidatePath("/stocks");
}

export async function adminUpdateEconomySettingAction(
  _prev: AdminEconomyActionState,
  formData: FormData,
): Promise<AdminEconomyActionState> {
  await requireAdmin();

  const key = formData.get("key")?.toString() ?? "";
  const kind = formData.get("kind")?.toString() ?? "amount";

  let value: Json;

  if (kind === "toggle") {
    value = { enabled: formData.get("enabled") === "true" };
  } else if (kind === "streak") {
    const amount = Number(formData.get("amount"));
    const maxStreak = Number(formData.get("max_streak") ?? 7);
    if (!Number.isFinite(amount) || amount < 0) {
      return { error: "Invalid bonus amount" };
    }
    value = { amount, currency: "USD", max_streak: maxStreak };
  } else {
    const amount = Number(formData.get("amount"));
    if (!Number.isFinite(amount) || amount <= 0) {
      return { error: "Invalid amount" };
    }
    value = { amount, currency: "USD" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_economy_setting", {
    p_key: key,
    p_value: value,
  });

  if (error) return { error: error.message };
  revalidateEconomy();
  return { success: "Setting updated" };
}

export async function adminToggleGameItemAction(
  _prev: AdminEconomyActionState,
  formData: FormData,
): Promise<AdminEconomyActionState> {
  await requireAdmin();

  const itemId = formData.get("item_id")?.toString();
  const isActive = formData.get("is_active") === "true";
  if (!itemId) return { error: "Missing item" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_game_item_active", {
    p_item_id: itemId,
    p_is_active: isActive,
  });

  if (error) return { error: error.message };
  revalidateEconomy();
  return { success: "Item updated" };
}

const newsSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(64)
    .regex(/^[a-z0-9-]+$/),
  title_en: z.string().min(3).max(120),
  title_tr: z.string().min(3).max(120),
  body_en: z.string().max(500).optional(),
  body_tr: z.string().max(500).optional(),
  sentiment: z.enum(["bullish", "bearish", "neutral"]),
  impact_percent: z.coerce.number().min(-15).max(15),
  symbols: z.string().min(1),
});

export async function adminCreateMarketNewsAction(
  _prev: AdminEconomyActionState,
  formData: FormData,
): Promise<AdminEconomyActionState> {
  await requireAdmin();

  const parsed = newsSchema.safeParse({
    slug: formData.get("slug"),
    title_en: formData.get("title_en"),
    title_tr: formData.get("title_tr"),
    body_en: formData.get("body_en")?.toString() || undefined,
    body_tr: formData.get("body_tr")?.toString() || undefined,
    sentiment: formData.get("sentiment"),
    impact_percent: formData.get("impact_percent"),
    symbols: formData.get("symbols"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid news" };
  }

  const symbols = parsed.data.symbols
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  if (symbols.length === 0) return { error: "Add at least one symbol" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_upsert_market_news", {
    p_slug: parsed.data.slug,
    p_title_en: parsed.data.title_en,
    p_title_tr: parsed.data.title_tr,
    p_body_en: parsed.data.body_en ?? "",
    p_body_tr: parsed.data.body_tr ?? "",
    p_sentiment: parsed.data.sentiment,
    p_impact_percent: parsed.data.impact_percent,
    p_symbols: symbols,
  });

  if (error) return { error: error.message };
  revalidateEconomy();
  return { success: "News published" };
}
