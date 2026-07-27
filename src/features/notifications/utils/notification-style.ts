import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  LineChart,
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
    default:
      return Bell;
  }
}

export function getNotificationAccent(type: NotificationType) {
  switch (type) {
    case "transfer_received":
    case "account_unfrozen":
    case "stock_order_filled":
      return "bg-success/10 text-success";
    case "transfer_failed":
    case "account_frozen":
    case "stock_order_rejected":
      return "bg-destructive/10 text-destructive";
    case "admin_action":
      return "bg-primary/10 text-primary";
    case "transfer_sent":
      return "bg-accent/10 text-accent";
    default:
      return "bg-secondary text-foreground";
  }
}
