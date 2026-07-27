"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { ActivityDirectionIcon } from "@/features/dashboard/components/quick-actions";
import type { ActivityItem } from "@/features/dashboard/types";
import { listItem } from "@/lib/motion";
import { formatCurrency, formatRelativeTime } from "@/utils/format";
import { cn } from "@/lib/utils";

type RecentActivityProps = {
  items: ActivityItem[];
  className?: string;
  showViewAll?: boolean;
};

export function RecentActivity({
  items,
  className,
  showViewAll = true,
}: RecentActivityProps) {
  const reduce = useReducedMotion();

  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Recent activity
          </h2>
          <p className="text-sm text-muted-foreground">
            Your latest virtual transactions
          </p>
        </div>
        {showViewAll && (
          <Link
            href="/transactions"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/70 bg-card/50 px-6 py-10 text-center">
          <p className="text-sm font-medium">No activity yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Send your first virtual transfer to see it here.
          </p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-3xl border border-border/50 bg-card/80 shadow-soft">
          <AnimatePresence mode="popLayout" initial={false}>
            {items.map((item, index) => (
              <motion.li
                key={item.id}
                layout={!reduce}
                variants={listItem}
                initial={reduce ? false : "hidden"}
                animate="show"
                exit={reduce ? undefined : "exit"}
              >
                <Link
                  href={`/transfer/receipt/${item.id}`}
                  className={cn(
                    "flex items-center gap-4 px-4 py-4 transition-colors hover:bg-secondary/50",
                    index !== items.length - 1 && "border-b border-border/50",
                  )}
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-secondary">
                    <ActivityDirectionIcon direction={item.direction} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium">
                        {item.title}
                      </p>
                      <p
                        className={cn(
                          "shrink-0 text-sm font-semibold",
                          item.direction === "in" && "text-success",
                          item.direction === "out" && "text-foreground",
                        )}
                      >
                        {item.direction === "in"
                          ? "+"
                          : item.direction === "out"
                            ? "−"
                            : ""}
                        {formatCurrency(item.amount)}
                      </p>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span className="truncate">
                        {item.subtitle || item.reference_id}
                      </span>
                      <span className="shrink-0 capitalize">
                        {formatRelativeTime(item.created_at)}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}
