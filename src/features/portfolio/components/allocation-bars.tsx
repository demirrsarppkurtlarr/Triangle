"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { PortfolioHolding } from "@/features/stocks/services/market.service";
import { softSpring } from "@/lib/motion";
import { cn } from "@/lib/utils";

const COLORS = [
  "bg-primary",
  "bg-accent",
  "bg-success",
  "bg-sky-400",
  "bg-indigo-400",
  "bg-cyan-500",
  "bg-blue-400",
  "bg-teal-400",
];

type AllocationBarsProps = {
  holdings: PortfolioHolding[];
  totalValue: number;
};

export function AllocationBars({ holdings, totalValue }: AllocationBarsProps) {
  const reduce = useReducedMotion();

  if (holdings.length === 0 || totalValue <= 0) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-[1.75rem] border border-border/50 bg-card/80 p-6 shadow-soft backdrop-blur-xl">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Allocation</h2>
        <p className="text-sm text-muted-foreground">
          How your virtual portfolio is distributed
        </p>
      </div>

      <div className="flex h-3 overflow-hidden rounded-full bg-secondary">
        {holdings.map((h, index) => {
          const width = (h.marketValue / totalValue) * 100;
          if (reduce) {
            return (
              <div
                key={h.symbol}
                className={cn(COLORS[index % COLORS.length], "h-full shrink-0")}
                style={{ width: `${width}%` }}
                title={`${h.symbol} ${width.toFixed(1)}%`}
              />
            );
          }
          return (
            <motion.div
              key={h.symbol}
              className={cn(COLORS[index % COLORS.length], "h-full shrink-0")}
              title={`${h.symbol} ${width.toFixed(1)}%`}
              initial={{ width: 0 }}
              animate={{ width: `${width}%` }}
              transition={{ ...softSpring, delay: index * 0.05 }}
            />
          );
        })}
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {holdings.map((h, index) => {
          const weight = (h.marketValue / totalValue) * 100;
          return (
            <li key={h.symbol} className="flex items-center gap-2 text-sm">
              <span
                className={cn(
                  "size-2.5 rounded-full",
                  COLORS[index % COLORS.length],
                )}
              />
              <span className="font-medium">{h.symbol}</span>
              <span className="text-muted-foreground">
                {weight.toFixed(1)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
