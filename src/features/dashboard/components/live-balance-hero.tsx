"use client";

import Link from "next/link";
import { ArrowUpRight, Send } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { AnimatedCurrency } from "@/components/motion/animated-currency";
import { TriangleIdBadge } from "@/components/brand/triangle-id-badge";
import { Button } from "@/components/ui/button";
import type { DashboardAccount, DashboardProfile } from "@/features/dashboard/types";
import { useRealtimeBalance } from "@/hooks/use-realtime-balance";
import { softSpring } from "@/lib/motion";
import { cn } from "@/lib/utils";

type LiveBalanceHeroProps = {
  profile: DashboardProfile;
  account: DashboardAccount;
  className?: string;
};

export function LiveBalanceHero({
  profile,
  account,
  className,
}: LiveBalanceHeroProps) {
  const reduce = useReducedMotion();
  const { balance, isLive, pulse } = useRealtimeBalance(
    account.id,
    account.balance,
  );

  return (
    <motion.section
      className={cn(
        "relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-primary to-accent p-6 text-primary-foreground shadow-glass md:p-8",
        className,
      )}
      initial={reduce ? false : { opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={softSpring}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-white/10 blur-2xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-10 left-10 size-32 rounded-full bg-white/10 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative z-10 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-primary-foreground/80">
                Virtual balance
              </p>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] backdrop-blur-sm",
                  isLive ? "text-white" : "text-white/60",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    isLive ? "animate-pulse bg-emerald-300" : "bg-white/40",
                  )}
                />
                {isLive ? "Live" : "Connecting"}
              </span>
            </div>
            <motion.p
              className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl"
              animate={
                reduce
                  ? undefined
                  : pulse
                    ? { scale: [1, 1.03, 1] }
                    : { scale: 1 }
              }
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <AnimatedCurrency
                value={balance}
                currency={account.currency}
              />
            </motion.p>
          </div>
          <div className="rounded-2xl bg-white/15 px-3 py-2 text-right backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.18em] text-primary-foreground/70">
              Account
            </p>
            <p className="font-mono text-xs">{account.account_number}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/70">
              Triangle ID
            </p>
            <TriangleIdBadge
              triangleId={profile.triangle_id}
              size="sm"
              className="mt-1 text-primary-foreground [&_button]:text-primary-foreground/80 [&_button:hover]:text-primary-foreground"
            />
          </div>

          <div className="flex gap-2">
            <Button
              asChild
              size="sm"
              className="rounded-2xl bg-white text-primary hover:bg-white/90"
            >
              <Link href="/transfer">
                <Send className="size-4" />
                Send
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="rounded-2xl border-white/30 bg-white/10 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
            >
              <Link href="/transactions">
                <ArrowUpRight className="size-4" />
                Activity
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
