import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n/dictionaries";

export type UserPreferences = {
  locale: Locale;
  emailNotifications: boolean;
  transferNotifications: boolean;
  marketNotifications: boolean;
  showcaseVehicleId: string | null;
  showcasePropertyId: string | null;
  showcaseGadgetId: string | null;
  showcaseCollectibleId: string | null;
};

const defaults: UserPreferences = {
  locale: "tr",
  emailNotifications: true,
  transferNotifications: true,
  marketNotifications: true,
  showcaseVehicleId: null,
  showcasePropertyId: null,
  showcaseGadgetId: null,
  showcaseCollectibleId: null,
};

export async function getUserPreferences(
  userId: string,
): Promise<UserPreferences> {
  const supabase = await createClient();
  await supabase.rpc("ensure_user_preferences").catch(() => null);

  const { data } = await supabase
    .from("user_preferences")
    .select(
      "locale, email_notifications, transfer_notifications, market_notifications, showcase_vehicle_id, showcase_property_id, showcase_gadget_id, showcase_collectible_id",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return defaults;

  return {
    locale: data.locale === "en" ? "en" : "tr",
    emailNotifications: Boolean(data.email_notifications),
    transferNotifications: Boolean(data.transfer_notifications),
    marketNotifications: Boolean(data.market_notifications),
    showcaseVehicleId: data.showcase_vehicle_id,
    showcasePropertyId: data.showcase_property_id,
    showcaseGadgetId: data.showcase_gadget_id,
    showcaseCollectibleId: data.showcase_collectible_id,
  };
}
