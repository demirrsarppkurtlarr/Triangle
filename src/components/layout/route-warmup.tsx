"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

type RouteWarmupProps = {
  routes: string[];
};

/** Prefetch key routes so navigations feel instant after first paint. */
export function RouteWarmup({ routes }: RouteWarmupProps) {
  const router = useRouter();
  const key = useMemo(() => routes.join("|"), [routes]);

  useEffect(() => {
    const list = key.split("|").filter(Boolean);
    const id = window.setTimeout(() => {
      for (const route of list) {
        try {
          router.prefetch(route);
        } catch {
          // ignore
        }
      }
    }, 100);

    return () => window.clearTimeout(id);
  }, [router, key]);

  return null;
}
