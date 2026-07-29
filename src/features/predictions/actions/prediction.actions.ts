"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PredictionActionState = { error?: string; success?: string };

function revalidate() {
  revalidatePath("/predictions");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
}

export async function placeBetAction(
  _prev: PredictionActionState,
  formData: FormData,
): Promise<PredictionActionState> {
  const predictionId = formData.get("prediction_id")?.toString();
  const direction = formData.get("direction")?.toString();
  const amount = Number(formData.get("amount"));
  if (!predictionId || !direction || !amount) return { error: "Eksik bilgi" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("place_prediction_bet", {
    p_prediction_id: predictionId,
    p_direction: direction,
    p_amount: amount,
  });
  if (error) return { error: error.message };
  revalidate();
  return { success: "Tahmin yapıldı" };
}

export async function spawnPredictionAction(): Promise<PredictionActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("spawn_prediction");
  if (error) return { error: error.message };
  revalidatePath("/predictions");
  return { success: "Yeni tahmin oluşturuldu" };
}

export async function resolveAction(): Promise<PredictionActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("resolve_predictions");
  if (error) return { error: error.message };
  revalidate();
  return { success: "Tahminler çözüldü" };
}
