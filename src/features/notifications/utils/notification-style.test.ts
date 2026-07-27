import { describe, expect, it } from "vitest";
import {
  ArrowDownLeft,
  LineChart,
  Shield,
  Snowflake,
  Sparkles,
} from "lucide-react";

import {
  getNotificationAccent,
  getNotificationIcon,
} from "@/features/notifications/utils/notification-style";

describe("notification-style", () => {
  it("maps icons by notification type", () => {
    expect(getNotificationIcon("transfer_received")).toBe(ArrowDownLeft);
    expect(getNotificationIcon("account_frozen")).toBe(Snowflake);
    expect(getNotificationIcon("stock_order_filled")).toBe(LineChart);
    expect(getNotificationIcon("admin_action")).toBe(Shield);
    expect(getNotificationIcon("system")).toBe(Sparkles);
  });

  it("returns success accents for positive events", () => {
    expect(getNotificationAccent("transfer_received")).toContain("success");
    expect(getNotificationAccent("stock_order_filled")).toContain("success");
  });

  it("returns destructive accents for failures", () => {
    expect(getNotificationAccent("transfer_failed")).toContain("destructive");
    expect(getNotificationAccent("account_frozen")).toContain("destructive");
  });
});
