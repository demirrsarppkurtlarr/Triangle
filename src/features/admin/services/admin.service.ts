import { createClient } from "@/lib/supabase/server";

export type AdminStats = {
  totalUsers: number;
  frozenUsers: number;
  totalTransfers: number;
  totalVolume: number;
  totalMinted: number;
  activeAccounts: number;
};

export type AdminUserRow = {
  id: string;
  triangle_id: string;
  username: string;
  email: string;
  full_name: string | null;
  is_frozen: boolean;
  is_admin: boolean;
  created_at: string;
  balance: number;
  account_status: string;
};

export type AdminTransactionRow = {
  id: string;
  reference_id: string;
  type: string;
  status: string;
  amount: number;
  description: string | null;
  created_at: string;
  initiated_by: string;
  initiator_username: string | null;
};

export type AdminLogRow = {
  id: string;
  action: string;
  target_user_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

export type AuditLogRow = {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient();

  const [
    { count: totalUsers },
    { count: frozenUsers },
    { data: transfers },
    { data: mints },
    { count: activeAccounts },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_frozen", true),
    supabase
      .from("transactions")
      .select("amount")
      .eq("type", "transfer")
      .eq("status", "completed"),
    supabase
      .from("transactions")
      .select("amount")
      .eq("type", "admin_mint")
      .eq("status", "completed"),
    supabase
      .from("bank_accounts")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
  ]);

  const totalVolume = (transfers ?? []).reduce(
    (sum, tx) => sum + Number(tx.amount),
    0,
  );
  const totalMinted = (mints ?? []).reduce(
    (sum, tx) => sum + Number(tx.amount),
    0,
  );

  return {
    totalUsers: totalUsers ?? 0,
    frozenUsers: frozenUsers ?? 0,
    totalTransfers: transfers?.length ?? 0,
    totalVolume,
    totalMinted,
    activeAccounts: activeAccounts ?? 0,
  };
}

export async function getAdminUsers(): Promise<AdminUserRow[]> {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select(
      "id, triangle_id, username, email, full_name, is_frozen, is_admin, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (!profiles?.length) return [];

  const { data: accounts } = await supabase
    .from("bank_accounts")
    .select("user_id, balance, status");

  const accountMap = new Map(
    (accounts ?? []).map((a) => [
      a.user_id,
      { balance: Number(a.balance), status: a.status },
    ]),
  );

  return profiles.map((p) => ({
    ...p,
    balance: accountMap.get(p.id)?.balance ?? 0,
    account_status: accountMap.get(p.id)?.status ?? "unknown",
  }));
}

export async function getAdminTransactions(): Promise<AdminTransactionRow[]> {
  const supabase = await createClient();

  const { data: txs } = await supabase
    .from("transactions")
    .select(
      "id, reference_id, type, status, amount, description, created_at, initiated_by",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (!txs?.length) return [];

  const initiatorIds = [...new Set(txs.map((t) => t.initiated_by))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", initiatorIds);

  const usernameMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.username]),
  );

  return txs.map((tx) => ({
    ...tx,
    amount: Number(tx.amount),
    initiator_username: usernameMap.get(tx.initiated_by) ?? null,
  }));
}

export async function getAdminLogs(): Promise<AdminLogRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("admin_logs")
    .select("id, action, target_user_id, details, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []).map((row) => ({
    ...row,
    details: (row.details ?? {}) as Record<string, unknown>,
  }));
}

export async function getAuditLogs(): Promise<AuditLogRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_logs")
    .select("id, user_id, action, resource_type, resource_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []).map((row) => ({
    ...row,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
  }));
}

export async function getPlatformLimits() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("key, value, description")
    .in("key", [
      "transfer_daily_limit",
      "transfer_single_limit",
      "transfer_fee_percent",
      "stock_trading_enabled",
      "maintenance_mode",
    ]);

  return data ?? [];
}
