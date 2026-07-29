"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SeasonActionState = { error?: string; success?: string };

export async function claimMissionAction(
  _prev: SeasonActionState,
  formData: FormData,
): Promise<SeasonActionState> {
  const missionId = formData.get("mission_id")?.toString();
  if (!missionId) return { error: "Missing mission" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("claim_season_mission", {
    p_mission_id: missionId,
  });
  if (error) return { error: error.message };
  revalidatePath("/battle-pass");
  revalidatePath("/dashboard");
  return { success: "Ödül alındı" };
}
