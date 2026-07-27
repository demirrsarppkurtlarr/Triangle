"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import type { NotificationItem } from "@/features/dashboard/types";
import {
  markAllReadFormAction,
  markOneReadAction,
} from "@/features/notifications/actions/notification.actions";
import {
  getNotificationAccent,
  getNotificationIcon,
} from "@/features/notifications/utils/notification-style";
import { createClient } from "@/lib/supabase/client";
import { listItem, softSpring } from "@/lib/motion";
import { formatRelativeTime } from "@/utils/format";
import { cn } from "@/lib/utils";

type NotificationsCenterProps = {
  userId: string;
  initialItems: NotificationItem[];
};

type Filter = "all" | "unread";

export function NotificationsCenter({
  userId,
  initialItems,
}: NotificationsCenterProps) {
  const reduce = useReducedMotion();
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<Filter>("all");
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications-center:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as NotificationItem;
          setItems((prev) => {
            if (prev.some((item) => item.id === row.id)) return prev;
            return [row, ...prev];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as NotificationItem;
          setItems((prev) =>
            prev.map((item) => (item.id === row.id ? { ...item, ...row } : item)),
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const unreadCount = items.filter((item) => !item.is_read).length;
  const visible =
    filter === "unread" ? items.filter((item) => !item.is_read) : items;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <LayoutGroup id="notif-filter">
          <div className="relative inline-flex rounded-2xl bg-secondary/80 p-1">
            {(
              [
                { id: "all", label: "All" },
                {
                  id: "unread",
                  label: `Unread${unreadCount ? ` · ${unreadCount}` : ""}`,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={cn(
                  "relative z-10 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                  filter === tab.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {filter === tab.id && !reduce && (
                  <motion.span
                    layoutId="notif-tab-pill"
                    className="absolute inset-0 -z-10 rounded-xl bg-card shadow-soft"
                    transition={softSpring}
                  />
                )}
                {filter === tab.id && reduce && (
                  <span className="absolute inset-0 -z-10 rounded-xl bg-card shadow-soft" />
                )}
                {tab.label}
              </button>
            ))}
          </div>
        </LayoutGroup>

        {unreadCount > 0 && (
          <form action={markAllReadFormAction}>
            <Button type="submit" variant="outline" size="sm" className="rounded-2xl">
              <CheckCheck className="size-4" />
              Mark all read
            </Button>
          </form>
        )}
      </div>

      {visible.length === 0 ? (
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[2rem] border border-dashed border-border/70 bg-card/50 px-8 py-16 text-center"
        >
          <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-secondary">
            <Bell className="size-6 text-muted-foreground" />
          </div>
          <p className="mt-5 text-lg font-semibold tracking-tight">
            {filter === "unread" ? "You're all caught up" : "No notifications yet"}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Transfers, stock fills, and account updates appear here in real time.
          </p>
        </motion.div>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence mode="popLayout" initial={!reduce}>
            {visible.map((item) => {
              const Icon = getNotificationIcon(item.type);
              return (
                <motion.li
                  key={item.id}
                  layout={!reduce}
                  variants={listItem}
                  initial={reduce ? false : "hidden"}
                  animate="show"
                  exit={reduce ? undefined : "exit"}
                >
                  <form
                    action={async (formData) => {
                      setPendingId(item.id);
                      await markOneReadAction(formData);
                      setItems((prev) =>
                        prev.map((n) =>
                          n.id === item.id ? { ...n, is_read: true } : n,
                        ),
                      );
                      setPendingId(null);
                    }}
                  >
                    <input type="hidden" name="id" value={item.id} />
                    <button
                      type="submit"
                      disabled={item.is_read || pendingId === item.id}
                      className={cn(
                        "flex w-full items-start gap-4 rounded-[1.5rem] border px-4 py-4 text-left transition-all",
                        item.is_read
                          ? "border-border/50 bg-card/70"
                          : "border-primary/15 bg-primary/[0.04] shadow-soft hover:-translate-y-0.5 hover:shadow-glass",
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-2xl",
                          getNotificationAccent(item.type),
                        )}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-semibold tracking-tight">
                            {item.title}
                          </p>
                          {!item.is_read && (
                            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {item.body}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {formatRelativeTime(item.created_at)}
                          {!item.is_read ? " · Tap to mark read" : ""}
                        </p>
                      </div>
                    </button>
                  </form>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
