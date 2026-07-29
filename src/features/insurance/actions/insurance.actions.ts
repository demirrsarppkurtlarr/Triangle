"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type InsuranceActionState = { error?: string; success?: string };

export async function buyInsuranceAction(
  _prev: InsuranceActionState,
  formData: FormData,
): Promise<InsuranceActionState> {
  const type = formData.get("type")?.toString();
  const coverage = Number(formData.get("coverage"));
  if (!type || !coverage || coverage < 500) return { error: "Minimum $500 teminat" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("buy_insurance", {
    p_type: type,
    p_coverage: coverage,
  });
  if (error) return { error: error.message };
  revalidatePath("/insurance");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  return { success: "Sigorta satın alındı" };
}
