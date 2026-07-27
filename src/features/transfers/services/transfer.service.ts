import type {
  TransferLimits,
  TransferReceipt,
  TransferResult,
} from "@/features/transfers/schemas/transfer.schemas";
import { createClient } from "@/lib/supabase/server";

export async function getTransferLimits(): Promise<TransferLimits> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["transfer_single_limit", "transfer_daily_limit"]);

  const single =
    (data?.find((s) => s.key === "transfer_single_limit")?.value as {
      amount?: number;
    })?.amount ?? 5000;

  const daily =
    (data?.find((s) => s.key === "transfer_daily_limit")?.value as {
      amount?: number;
    })?.amount ?? 10000;

  return { singleLimit: Number(single), dailyLimit: Number(daily) };
}

export async function getDailyTransferTotal(userId: string): Promise<number> {
  const supabase = await createClient();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("transactions")
    .select("amount")
    .eq("initiated_by", userId)
    .eq("type", "transfer")
    .eq("status", "completed")
    .gte("created_at", startOfDay.toISOString());

  return (data ?? []).reduce((sum, tx) => sum + Number(tx.amount), 0);
}

export async function getTransferReceipt(
  transactionId: string,
  userId: string,
): Promise<TransferReceipt | null> {
  const supabase = await createClient();

  const { data: tx, error } = await supabase
    .from("transactions")
    .select(
      "id, reference_id, type, status, amount, fee, description, created_at, completed_at, from_account_id, to_account_id, initiated_by",
    )
    .eq("id", transactionId)
    .single();

  if (error || !tx) return null;

  const { data: myAccount } = await supabase
    .from("bank_accounts")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!myAccount) return null;

  const isOutgoing = tx.from_account_id === myAccount.id;
  const isIncoming = tx.to_account_id === myAccount.id;

  if (!isOutgoing && !isIncoming && tx.initiated_by !== userId) {
    return null;
  }

  const counterpartyAccountId = isOutgoing
    ? tx.to_account_id
    : tx.from_account_id;

  let counterparty: TransferReceipt["counterparty"] = null;

  if (counterpartyAccountId) {
    const { data: counterAccount } = await supabase
      .from("bank_accounts")
      .select("user_id")
      .eq("id", counterpartyAccountId)
      .single();

    if (counterAccount) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("triangle_id, username, full_name")
        .eq("id", counterAccount.user_id)
        .single();

      if (profile) counterparty = profile;
    }
  }

  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("triangle_id, username")
    .eq("id", tx.initiated_by)
    .single();

  if (!senderProfile) return null;

  return {
    id: tx.id,
    reference_id: tx.reference_id,
    type: tx.type,
    status: tx.status,
    amount: Number(tx.amount),
    fee: Number(tx.fee),
    description: tx.description,
    created_at: tx.created_at,
    completed_at: tx.completed_at,
    direction: isOutgoing ? "out" : "in",
    counterparty,
    sender: senderProfile,
  };
}

export function parseTransferResult(data: unknown): TransferResult | null {
  if (!data || typeof data !== "object") return null;
  const result = data as Record<string, unknown>;
  if (result.success !== true) return null;
  return {
    success: true,
    transaction_id: result.transaction_id as string | undefined,
    reference_id: result.reference_id as string | undefined,
    duplicate: result.duplicate as boolean | undefined,
  };
}
