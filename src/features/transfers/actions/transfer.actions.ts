"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";

import { createTransferSchema } from "@/features/transfers/schemas/transfer.schemas";
import {
  getTransferLimits,
  parseTransferResult,
} from "@/features/transfers/services/transfer.service";
import { createClient } from "@/lib/supabase/server";
import { normalizeTriangleId } from "@/utils/triangle-id";

export type TransferActionState = {
  error?: string;
};

export async function transferFundsAction(
  _prevState: TransferActionState,
  formData: FormData,
): Promise<TransferActionState> {
  const limits = await getTransferLimits();
  const schema = createTransferSchema(limits.singleLimit);

  const parsed = schema.safeParse({
    to_triangle_id: normalizeTriangleId(
      formData.get("to_triangle_id")?.toString() ?? "",
    ),
    amount: formData.get("amount"),
    description: formData.get("description")?.toString() || undefined,
    idempotency_key:
      formData.get("idempotency_key")?.toString() || randomUUID(),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid transfer details",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("triangle_id, is_frozen")
    .eq("id", user.id)
    .single();

  if (profile?.is_frozen) {
    return { error: "Your account is frozen" };
  }

  if (profile?.triangle_id === parsed.data.to_triangle_id) {
    return { error: "You cannot transfer to yourself" };
  }

  const { data, error } = await supabase.rpc("transfer_funds", {
    p_to_triangle_id: parsed.data.to_triangle_id,
    p_amount: parsed.data.amount,
    p_description: parsed.data.description ?? null,
    p_idempotency_key: parsed.data.idempotency_key ?? null,
  });

  if (error) {
    return { error: error.message };
  }

  const result = parseTransferResult(data);

  if (!result?.transaction_id) {
    return { error: "Transfer failed. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/notifications");

  redirect(`/transfer/receipt/${result.transaction_id}`);
}
