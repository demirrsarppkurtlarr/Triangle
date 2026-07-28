"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { tickMarketPricesSilentAction } from "@/features/stocks/actions/stock.actions";
import { spawnMarketNewsSilentAction } from "@/features/market-news/actions/news.actions";

/** Global cadence: one shared tick every 10 seconds for all players. */
const SERVER_TICK_MS = 10_000;

export function MarketAutoTick() {
  const busy = useRef(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      if (busy.current || document.visibilityState !== "visible") return;
      busy.current = true;
      try {
        if (cancelled) return;
        await tickMarketPricesSilentAction();
        await spawnMarketNewsSilentAction().catch(() => null);
        if (!cancelled) router.refresh();
      } finally {
        busy.current = false;
      }
    }

    void tick();
    const id = window.setInterval(tick, SERVER_TICK_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [router]);

  return null;
}
