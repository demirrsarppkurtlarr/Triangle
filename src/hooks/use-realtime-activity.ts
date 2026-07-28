"use client";

import { useEffect, useRef, useState } from "react";

import type { ActivityItem } from "@/features/dashboard/types";
import { createClient } from "@/lib/supabase/client";

export function useRealtimeActivity(
  userId: string | undefined,
  accountId: string | undefined,
  initialItems: ActivityItem[],
) {
  const [extraItems, setExtraItems] = useState<ActivityItem[]>([]);
  const initialIds = useRef(new Set(initialItems.map((i) => i.id)));

  useEffect(() => {
    initialIds.current = new Set(initialItems.map((i) => i.id));
  }, [initialItems]);

  useEffect(() => {
    if (!userId || !accountId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`activity:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transactions",
        },
        (payload) => {
          const tx = payload.new as {
            id: string;
            reference_id: string;
            type: ActivityItem["type"];
            status: ActivityItem["status"];
            amount: number | string;
            description: string | null;
            created_at: string;
            from_account_id: string | null;
            to_account_id: string | null;
            initiated_by: string;
          };

          const relevant =
            tx.initiated_by === userId ||
            tx.from_account_id === accountId ||
            tx.to_account_id === accountId;

          if (!relevant) return;
          if (initialIds.current.has(tx.id)) return;

          let direction: ActivityItem["direction"] = "neutral";
          if (
            tx.to_account_id === accountId &&
            tx.from_account_id !== accountId
          ) {
            direction = "in";
          } else if (tx.from_account_id === accountId) {
            direction = "out";
          }

          const titleMap: Record<ActivityItem["type"], string> = {
            transfer: direction === "in" ? "Money received" : "Transfer sent",
            deposit: "Deposit",
            withdrawal: "Withdrawal",
            stock_buy: "Stock purchase",
            stock_sell: "Stock sale",
            admin_mint: "Funds added",
            fee: "Fee",
            game_purchase: "Shop purchase",
            game_sale: "Shop sale",
            item_trade:
              direction === "in" ? "Marketplace sale" : "Marketplace buy",
            daily_reward: "Daily reward",
            interest: "Bank interest",
            rent: "Property rent",
            job_pay: "Job pay",
            lottery: "Lucky spin",
            quest_reward: "Quest reward",
          };

          const nextItem: ActivityItem = {
            id: tx.id,
            reference_id: tx.reference_id,
            type: tx.type,
            status: tx.status,
            amount: Number(tx.amount),
            direction,
            title: titleMap[tx.type] ?? "Transaction",
            subtitle: tx.description,
            created_at: tx.created_at,
          };

          setExtraItems((prev) => {
            if (prev.some((item) => item.id === nextItem.id)) return prev;
            return [nextItem, ...prev];
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, accountId]);

  const merged = [...extraItems, ...initialItems]
    .filter(
      (item, index, arr) =>
        arr.findIndex((candidate) => candidate.id === item.id) === index,
    )
    .slice(0, 8);

  return merged;
}
