"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

import type { NotificationItem } from "@/features/dashboard/types";
import {
  getNotificationAccent,
  getNotificationIcon,
} from "@/features/notifications/utils/notification-style";
import { formatRelativeTime } from "@/utils/format";
import { cn } from "@/lib/utils";

type NotificationsPreviewProps = {
  items: NotificationItem[];
  unreadCount: number;
  className?: string;
};

export function NotificationsPreview({
  items,
  unreadCount,
  className,
}: NotificationsPreviewProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Notifications
          </h2>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread`
              : "You're all caught up"}
          </p>
        </div>
        <Link
          href="/notifications"
          className="text-sm font-medium text-primary hover:underline"
        >
          View all
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/70 bg-card/50 px-6 py-8 text-center">
          <Bell className="mx-auto size-5 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No notifications</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Live alerts appear here as activity happens.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {items.slice(0, 5).map((item) => {
            const Icon = getNotificationIcon(item.type);
            return (
              <li key={item.id}>
                <Link
                  href="/notifications"
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border px-3.5 py-3 transition-colors hover:bg-secondary/50",
                    item.is_read
                      ? "border-border/50 bg-card/60"
                      : "border-primary/20 bg-primary/5",
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl",
                      getNotificationAccent(item.type),
                    )}
                  >
                    <Icon className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      {!item.is_read && (
                        <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {item.body}
                    </p>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      {formatRelativeTime(item.created_at)}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
