"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/features/admin/services/admin-auth.service";
import { createClient } from "@/lib/supabase/server";
import { triangleIdSchema } from "@/schemas";
import { normalizeTriangleId } from "@/utils/triangle-id";

export type AdminActionState = {
  error?: string;
  success?: string;
};

const mintSchema = z.object({
  triangle_id: triangleIdSchema,
  amount: z.coerce
    .number()
    .positive("Amount must be greater than zero")
    .max(1_000_000, "Maximum mint is $1,000,000"),
  reason: z.string().max(200).optional(),
});

const freezeSchema = z.object({
  triangle_id: triangleIdSchema,
  reason: z.string().max(200).optional(),
});

const limitsSchema = z.object({
  single_limit: z.coerce.number().positive().max(1_000_000),
  daily_limit: z.coerce.number().positive().max(10_000_000),
});

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/transfers");
  revalidatePath("/admin/limits");
  revalidatePath("/admin/logs");
  revalidatePath("/dashboard");
}

export async function adminMintAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = mintSchema.safeParse({
    triangle_id: normalizeTriangleId(
      formData.get("triangle_id")?.toString() ?? "",
    ),
    amount: formData.get("amount"),
    reason: formData.get("reason")?.toString() || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_mint_funds", {
    p_target_triangle_id: parsed.data.triangle_id,
    p_amount: parsed.data.amount,
    p_reason: parsed.data.reason ?? "Admin mint",
  });

  if (error) return { error: error.message };

  revalidateAdmin();
  return {
    success: `Minted $${parsed.data.amount.toFixed(2)} to ${parsed.data.triangle_id}`,
  };
}

export async function adminFreezeAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = freezeSchema.safeParse({
    triangle_id: normalizeTriangleId(
      formData.get("triangle_id")?.toString() ?? "",
    ),
    reason: formData.get("reason")?.toString() || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_freeze_user", {
    p_target_triangle_id: parsed.data.triangle_id,
    p_reason: parsed.data.reason ?? "Policy violation",
  });

  if (error) return { error: error.message };

  revalidateAdmin();
  return { success: `Frozen ${parsed.data.triangle_id}` };
}

export async function adminUnfreezeAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();

  const triangleId = normalizeTriangleId(
    formData.get("triangle_id")?.toString() ?? "",
  );

  if (!triangleIdSchema.safeParse(triangleId).success) {
    return { error: "Invalid Triangle ID" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_unfreeze_user", {
    p_target_triangle_id: triangleId,
  });

  if (error) return { error: error.message };

  revalidateAdmin();
  return { success: `Unfrozen ${triangleId}` };
}

export async function adminUpdateLimitsAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const { userId } = await requireAdmin();

  const parsed = limitsSchema.safeParse({
    single_limit: formData.get("single_limit"),
    daily_limit: formData.get("daily_limit"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid limits" };
  }

  if (parsed.data.daily_limit < parsed.data.single_limit) {
    return { error: "Daily limit must be greater than or equal to single limit" };
  }

  const supabase = await createClient();

  const { error: singleError } = await supabase
    .from("settings")
    .update({
      value: { amount: parsed.data.single_limit, currency: "USD" },
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq("key", "transfer_single_limit");

  if (singleError) return { error: singleError.message };

  const { error: dailyError } = await supabase
    .from("settings")
    .update({
      value: { amount: parsed.data.daily_limit, currency: "USD" },
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq("key", "transfer_daily_limit");

  if (dailyError) return { error: dailyError.message };

  revalidateAdmin();
  revalidatePath("/transfer");
  return { success: "Transfer limits updated" };
}
