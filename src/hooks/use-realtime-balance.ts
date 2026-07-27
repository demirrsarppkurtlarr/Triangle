"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function useRealtimeBalance(
  accountId: string | undefined,
  initialBalance: number,
) {
  const [liveBalance, setLiveBalance] = useState<number | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!accountId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`balance:${accountId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bank_accounts",
          filter: `id=eq.${accountId}`,
        },
        (payload) => {
          const next = Number(
            (payload.new as { balance?: number | string }).balance,
          );
          if (Number.isFinite(next)) {
            setLiveBalance(next);
            setPulse(true);
            window.setTimeout(() => setPulse(false), 700);
          }
        },
      )
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [accountId]);

  return {
    balance: liveBalance ?? initialBalance,
    isLive,
    pulse,
  };
}
