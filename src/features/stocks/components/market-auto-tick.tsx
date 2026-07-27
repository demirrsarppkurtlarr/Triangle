"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { refreshMarketPricesAction } from "@/features/stocks/actions/stock.actions";

/** Persist a real random-walk tick to the DB while the market page is open. */
const SERVER_TICK_MS = 3000;

export function MarketAutoTick() {
  const router = useRouter();
  const busy = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      if (busy.current || document.visibilityState !== "visible") return;
      busy.current = true;
      try {
        const result = await refreshMarketPricesAction();
        if (!cancelled && result.success) router.refresh();
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
