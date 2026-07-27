"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { AnimatedCurrency } from "@/components/motion/animated-currency";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import type { PortfolioSummary } from "@/features/portfolio/services/portfolio.service";
import { softSpring } from "@/lib/motion";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";

type PortfolioHeroProps = {
  summary: PortfolioSummary;
};

export function PortfolioHero({ summary }: PortfolioHeroProps) {
  const reduce = useReducedMotion();
  const positive = summary.totalPnl >= 0;

  return (
    <motion.section
      className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0EA5E9] p-5 text-white shadow-glass sm:rounded-[2rem] sm:p-7 md:p-10"
      initial={reduce ? false : { opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={softSpring}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-white/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 left-10 size-48 rounded-full bg-cyan-300/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 space-y-6 md:space-y-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/60 sm:text-xs">
              Portfolio
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight sm:mt-3 sm:text-4xl md:text-5xl">
              <AnimatedCurrency value={summary.totalValue} />
            </p>
            <p
              className={cn(
                "mt-2 text-sm font-medium",
                positive ? "text-emerald-300" : "text-rose-300",
              )}
            >
              {positive ? "+" : ""}
              {formatCurrency(summary.totalPnl)} · {positive ? "+" : ""}
              {summary.totalPnlPercent.toFixed(2)}%
            </p>
          </div>

          <Link
            href="/stocks"
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur-md transition-colors hover:bg-white/25 active:scale-[0.98]"
          >
            Trade
            <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <Stagger
          className="grid grid-cols-2 gap-4 md:grid-cols-4"
          fast
        >
          <StaggerItem>
            <Metric
              label="Invested"
              value={formatCurrency(summary.totalCost)}
            />
          </StaggerItem>
          <StaggerItem>
            <Metric
              label="Cash"
              value={formatCurrency(summary.cashBalance)}
            />
          </StaggerItem>
          <StaggerItem>
            <Metric
              label="Positions"
              value={String(summary.holdingsCount)}
            />
          </StaggerItem>
          <StaggerItem>
            <Metric
              label="Invested share"
              value={`${summary.dayWeight.toFixed(0)}%`}
            />
          </StaggerItem>
        </Stagger>
      </div>
    </motion.section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
      <p className="text-[11px] uppercase tracking-[0.16em] text-white/55">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
    </div>
  );
}
