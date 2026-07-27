import type {
  ActivityItem,
  DashboardAccount,
  DashboardData,
  DashboardProfile,
  NotificationItem,
  TransactionType,
} from "@/features/dashboard/types";
import { createClient } from "@/lib/supabase/server";

function getActivityTitle(type: TransactionType, direction: ActivityItem["direction"]) {
  const labels: Record<TransactionType, string> = {
    transfer: direction === "in" ? "Money received" : "Transfer sent",
    deposit: "Deposit",
    withdrawal: "Withdrawal",
    stock_buy: "Stock purchase",
    stock_sell: "Stock sale",
    admin_mint: "Funds added",
    fee: "Fee",
    game_purchase: "Shop purchase",
    game_sale: "Shop sale",
    item_trade: direction === "in" ? "Marketplace sale" : "Marketplace buy",
    daily_reward: "Daily reward",
  };
  return labels[type];
}

function mapTransactionToActivity(
  tx: {
    id: string;
    reference_id: string;
    type: TransactionType;
    status: ActivityItem["status"];
    amount: number;
    description: string | null;
    created_at: string;
    from_account_id: string | null;
    to_account_id: string | null;
    initiated_by: string;
  },
  accountId: string,
  userId: string,
): ActivityItem {
  let direction: ActivityItem["direction"] = "neutral";

  if (tx.to_account_id === accountId && tx.from_account_id !== accountId) {
    direction = "in";
  } else if (tx.from_account_id === accountId) {
    direction = "out";
  } else if (tx.initiated_by === userId && tx.type !== "admin_mint") {
    direction = "out";
  } else if (tx.type === "admin_mint" && tx.to_account_id === accountId) {
    direction = "in";
  }

  return {
    id: tx.id,
    reference_id: tx.reference_id,
    type: tx.type,
    status: tx.status,
    amount: Number(tx.amount),
    direction,
    title: getActivityTitle(tx.type, direction),
    subtitle: tx.description,
    created_at: tx.created_at,
  };
}

export async function getDashboardData(
  userId: string,
): Promise<DashboardData | null> {
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, triangle_id, username, full_name, email, is_admin, is_frozen")
    .eq("id", userId)
    .single();

  if (profileError || !profile) return null;

  const { data: account, error: accountError } = await supabase
    .from("bank_accounts")
    .select("id, account_number, balance, currency, status")
    .eq("user_id", userId)
    .single();

  if (accountError || !account) return null;

  const { data: transactions } = await supabase
    .from("transactions")
    .select(
      "id, reference_id, type, status, amount, description, created_at, from_account_id, to_account_id, initiated_by",
    )
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, title, body, is_read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  const recentActivity = (transactions ?? []).map((tx) =>
    mapTransactionToActivity(
      {
        ...tx,
        type: tx.type as TransactionType,
        status: tx.status as ActivityItem["status"],
      },
      account.id,
      userId,
    ),
  );

  const notificationItems = (notifications ?? []) as NotificationItem[];
  const unreadCount = notificationItems.filter((n) => !n.is_read).length;

  return {
    profile: profile as DashboardProfile,
    account: {
      ...account,
      balance: Number(account.balance),
    } as DashboardAccount,
    recentActivity,
    notifications: notificationItems,
    unreadCount,
  };
}

export async function getAllTransactions(userId: string, accountId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id, reference_id, type, status, amount, description, created_at, from_account_id, to_account_id, initiated_by",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return [];

  return (data ?? []).map((tx) =>
    mapTransactionToActivity(
      {
        ...tx,
        type: tx.type as TransactionType,
        status: tx.status as ActivityItem["status"],
      },
      accountId,
      userId,
    ),
  );
}
