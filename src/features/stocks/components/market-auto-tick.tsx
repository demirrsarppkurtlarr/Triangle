"use client";

import { useEffect, useRef } from "react";

import { tickMarketPricesSilentAction } from "@/features/stocks/actions/stock.actions";

/** Persist server ticks quietly — UI prices move on the client without remounting. */
const SERVER_TICK_MS = 12_000;

export function MarketAutoTick() {
  const busy = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      if (busy.current || document.visibilityState !== "visible") return;
      busy.current = true;
      try {
        if (!cancelled) await tickMarketPricesSilentAction();
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
  }, []);

  return null;
}
