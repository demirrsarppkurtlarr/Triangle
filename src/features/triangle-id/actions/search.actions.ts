"use server";

import type { UserSearchResult } from "@/features/triangle-id/types";
import type { ApiResponse } from "@/types/api";
import { createClient } from "@/lib/supabase/server";

export async function searchUsersByQuery(
  query: string,
): Promise<ApiResponse<UserSearchResult[]>> {
  if (!query || query.trim().length < 2) {
    return { success: true, data: [] };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data, error } = await supabase.rpc("search_users", {
    p_query: query.trim(),
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: (data ?? []) as UserSearchResult[],
  };
}

export async function getProfileByTriangleId(triangleId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false as const, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("triangle_id, username, full_name, avatar_url")
    .eq("triangle_id", triangleId.trim().toUpperCase())
    .eq("is_frozen", false)
    .maybeSingle();

  if (error) {
    return { success: false as const, error: error.message };
  }

  if (!data) {
    return { success: false as const, error: "User not found" };
  }

  return { success: true as const, data };
}
