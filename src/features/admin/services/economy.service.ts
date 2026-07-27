import "server-only";

import { createClient } from "@/lib/supabase/server";

export type EconomySettings = {
  dailyBase: number;
  streakBonus: number;
  maxStreak: number;
  shopEnabled: boolean;
  marketplaceEnabled: boolean;
  tradingEnabled: boolean;
};

export type AdminGameItem = {
  id: string;
  slug: string;
  name: string;
  category: string;
  shopPrice: number;
  isActive: boolean;
};

function amountFromSetting(value: unknown, fallback: number) {
  if (
    value &&
    typeof value === "object" &&
    "amount" in value &&
    typeof (value as { amount: unknown }).amount === "number"
  ) {
    return Number((value as { amount: number }).amount);
  }
  return fallback;
}

function enabledFromSetting(value: unknown, fallback: boolean) {
  if (
    value &&
    typeof value === "object" &&
    "enabled" in value &&
    typeof (value as { enabled: unknown }).enabled === "boolean"
  ) {
    return Boolean((value as { enabled: boolean }).enabled);
  }
  return fallback;
}

export async function getEconomySettings(): Promise<EconomySettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", [
      "daily_reward_base",
      "daily_reward_streak_bonus",
      "shop_enabled",
      "marketplace_enabled",
      "stock_trading_enabled",
    ]);

  const map = new Map((data ?? []).map((row) => [row.key, row.value]));

  const streak = map.get("daily_reward_streak_bonus") as
    | { amount?: number; max_streak?: number }
    | undefined;

  return {
    dailyBase: amountFromSetting(map.get("daily_reward_base"), 50),
    streakBonus: Number(streak?.amount ?? 10),
    maxStreak: Number(streak?.max_streak ?? 7),
    shopEnabled: enabledFromSetting(map.get("shop_enabled"), true),
    marketplaceEnabled: enabledFromSetting(map.get("marketplace_enabled"), true),
    tradingEnabled: enabledFromSetting(map.get("stock_trading_enabled"), true),
  };
}

export async function getAdminGameItems(): Promise<AdminGameItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("game_items")
    .select("id, slug, name, category, shop_price, is_active")
    .order("sort_order");

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    shopPrice: Number(row.shop_price),
    isActive: Boolean(row.is_active),
  }));
}
