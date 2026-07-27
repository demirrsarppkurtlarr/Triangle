"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { LOCALE_COOKIE, type Locale } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";

export type SettingsActionState = {
  error?: string;
  success?: string;
};

export async function setLocaleAction(locale: Locale) {
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, locale === "en" ? "en" : "tr", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.rpc("update_user_preferences", {
      p_locale: locale === "en" ? "en" : "tr",
    });
  }

  revalidatePath("/", "layout");
}

export async function updatePreferencesAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const localeRaw = formData.get("locale")?.toString();
  const locale = localeRaw === "en" || localeRaw === "tr" ? localeRaw : null;

  const { error } = await supabase.rpc("update_user_preferences", {
    p_locale: locale,
    p_email_notifications: formData.get("email_notifications") === "true",
    p_transfer_notifications: formData.get("transfer_notifications") === "true",
    p_market_notifications: formData.get("market_notifications") === "true",
  });

  if (error) return { error: error.message };

  if (locale) {
    const jar = await cookies();
    jar.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { success: "ok" };
}
