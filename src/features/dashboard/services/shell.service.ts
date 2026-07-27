import { createClient } from "@/lib/supabase/server";
import { ADMIN_USERNAME } from "@/utils/constants";

export type ShellNavData = {
  userId: string;
  unreadCount: number;
  isAdmin: boolean;
};

/** Lightweight shell data — avoid full dashboard fetch on every navigation. */
export async function getShellNavData(
  userId: string,
): Promise<ShellNavData | null> {
  const supabase = await createClient();

  const [{ data: profile }, { count }] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, is_admin, is_frozen")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false),
  ]);

  if (!profile) return null;

  return {
    userId,
    unreadCount: count ?? 0,
    isAdmin: Boolean(
      profile.username === ADMIN_USERNAME &&
        profile.is_admin &&
        !profile.is_frozen,
    ),
  };
}
