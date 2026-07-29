import "server-only";

import { createClient } from "@/lib/supabase/server";

export type CustomTheme = {
  id: string;
  name: string;
  descriptionEn: string;
  descriptionTr: string;
  price: number;
  cssVars: Record<string, string>;
  isFree: boolean;
  owned: boolean;
};

export async function getThemesData(userId: string) {
  const supabase = await createClient();

  const [{ data: themes }, { data: owned }, { data: prefs }, { data: account }] =
    await Promise.all([
      supabase.from("custom_themes").select("*").order("sort_order"),
      supabase.from("user_themes").select("theme_id").eq("user_id", userId),
      supabase.from("user_preferences").select("active_theme").eq("user_id", userId).maybeSingle(),
      supabase.from("bank_accounts").select("balance").eq("user_id", userId).maybeSingle(),
    ]);

  const ownedSet = new Set((owned ?? []).map((o) => o.theme_id));

  return {
    themes: (themes ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      descriptionEn: t.description_en,
      descriptionTr: t.description_tr,
      price: Number(t.price),
      cssVars: (t.css_vars ?? {}) as Record<string, string>,
      isFree: t.is_free,
      owned: t.is_free || ownedSet.has(t.id),
    })),
    activeTheme: prefs?.active_theme ?? "default",
    cash: Number(account?.balance ?? 0),
  };
}
