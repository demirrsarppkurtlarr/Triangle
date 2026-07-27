"use client";

import { RecentActivity } from "@/features/dashboard/components/recent-activity";
import type { ActivityItem } from "@/features/dashboard/types";
import { useRealtimeActivity } from "@/hooks/use-realtime-activity";

type LiveRecentActivityProps = {
  userId: string;
  accountId: string;
  initialItems: ActivityItem[];
};

export function LiveRecentActivity({
  userId,
  accountId,
  initialItems,
}: LiveRecentActivityProps) {
  const items = useRealtimeActivity(userId, accountId, initialItems);
  return <RecentActivity items={items} />;
}
