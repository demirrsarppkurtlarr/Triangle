import { redirect } from "next/navigation";

import { canAccessAdmin } from "@/features/admin/lib/admin-gate";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

/**
 * Server-side admin gate. Never trust the client for role checks.
 * Admin = username demirsarpk AND is_admin = true AND not frozen.
 */
export async function requireAdmin(): Promise<{
  userId: string;
  profile: Profile;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || !canAccessAdmin(profile)) {
    redirect("/dashboard");
  }

  return { userId: user.id, profile };
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, is_admin, is_frozen")
    .eq("id", user.id)
    .single();

  return canAccessAdmin(profile);
}
