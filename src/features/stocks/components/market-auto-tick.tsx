"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { refreshMarketPricesAction } from "@/features/stocks/actions/stock.actions";

const TICK_MS = 4000;

/** Quietly advances the simulated market every few seconds while the page is open. */
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

    const id = window.setInterval(tick, TICK_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [router]);

  return null;
}
