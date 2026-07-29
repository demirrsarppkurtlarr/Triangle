"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ThemeActionState = { error?: string; success?: string };

export async function buyThemeAction(
  _prev: ThemeActionState,
  formData: FormData,
): Promise<ThemeActionState> {
  const themeId = formData.get("theme_id")?.toString();
  if (!themeId) return { error: "Missing theme" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("buy_theme", { p_theme_id: themeId });
  if (error) return { error: error.message };
  revalidatePath("/themes");
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: "Tema aktif" };
}
