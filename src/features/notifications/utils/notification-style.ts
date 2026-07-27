import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Gift,
  LineChart,
  Newspaper,
  Package,
  Shield,
  Snowflake,
  Sparkles,
} from "lucide-react";

import type { NotificationType } from "@/features/dashboard/types";

export function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "transfer_received":
      return ArrowDownLeft;
    case "transfer_sent":
      return ArrowUpRight;
    case "transfer_failed":
      return ArrowUpRight;
    case "account_frozen":
    case "account_unfrozen":
      return Snowflake;
    case "stock_order_filled":
    case "stock_order_rejected":
      return LineChart;
    case "admin_action":
      return Shield;
    case "system":
      return Sparkles;
    case "game_item":
      return Package;
    case "daily_reward":
      return Gift;
    case "market_news":
      return Newspaper;
    default:
      return Bell;
  }
}

export function getNotificationAccent(type: NotificationType) {
  switch (type) {
    case "transfer_received":
    case "account_unfrozen":
    case "stock_order_filled":
    case "daily_reward":
      return "bg-success/10 text-success";
    case "transfer_failed":
    case "account_frozen":
    case "stock_order_rejected":
      return "bg-destructive/10 text-destructive";
    case "admin_action":
      return "bg-primary/10 text-primary";
    case "transfer_sent":
    case "market_news":
      return "bg-accent/10 text-accent";
    default:
      return "bg-secondary text-foreground";
  }
}
