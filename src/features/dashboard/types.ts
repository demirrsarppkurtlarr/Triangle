export type TransactionType =
  | "transfer"
  | "deposit"
  | "withdrawal"
  | "stock_buy"
  | "stock_sell"
  | "admin_mint"
  | "fee"
  | "game_purchase"
  | "game_sale"
  | "item_trade";

export type TransactionStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export type NotificationType =
  | "transfer_received"
  | "transfer_sent"
  | "transfer_failed"
  | "account_frozen"
  | "account_unfrozen"
  | "stock_order_filled"
  | "stock_order_rejected"
  | "admin_action"
  | "system"
  | "game_item";

export type DashboardProfile = {
  id: string;
  triangle_id: string;
  username: string;
  full_name: string | null;
  email: string;
  is_admin: boolean;
  is_frozen: boolean;
};

export type DashboardAccount = {
  id: string;
  account_number: string;
  balance: number;
  currency: string;
  status: string;
};

export type ActivityItem = {
  id: string;
  reference_id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  direction: "in" | "out" | "neutral";
  title: string;
  subtitle: string | null;
  created_at: string;
};

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
};

export type DashboardData = {
  profile: DashboardProfile;
  account: DashboardAccount;
  recentActivity: ActivityItem[];
  notifications: NotificationItem[];
  unreadCount: number;
};
