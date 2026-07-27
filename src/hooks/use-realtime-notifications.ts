"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

type LiveNotification = {
  id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
};

export function useRealtimeNotifications(
  userId: string | undefined,
  initialUnread: number,
) {
  const [delta, setDelta] = useState(0);
  const [latest, setLatest] = useState<LiveNotification | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as LiveNotification;
          setLatest(row);
          setDelta((count) => count + 1);
          toast(row.title, {
            description: row.body,
            duration: 4500,
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
          const row = payload.new as LiveNotification;
          const prev = payload.old as { is_read?: boolean };
          if (prev.is_read === false && row.is_read === true) {
            setDelta((count) => count - 1);
          }
        },
      )
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return {
    unreadCount: Math.max(0, initialUnread + delta),
    latest,
    isLive,
  };
}
