"use client";

import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Briefcase,
  History,
  Send,
  Settings,
  TrendingUp,
} from "lucide-react";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { cn } from "@/lib/utils";

const actions = [
  {
    href: "/transfer",
    label: "Send",
    description: "Transfer virtual money",
    icon: Send,
    accent: "bg-primary/10 text-primary",
  },
  {
    href: "/stocks",
    label: "Market",
    description: "Trade US equities",
    icon: TrendingUp,
    accent: "bg-accent/10 text-accent",
  },
  {
    href: "/portfolio",
    label: "Portfolio",
    description: "Holdings & P/L",
    icon: Briefcase,
    accent: "bg-success/10 text-success",
  },
  {
    href: "/transactions",
    label: "History",
    description: "All activity",
    icon: History,
    accent: "bg-secondary text-foreground",
  },
  {
    href: "/notifications",
    label: "Alerts",
    description: "Live notifications",
    icon: Bell,
    accent: "bg-secondary text-foreground",
  },
  {
    href: "/settings",
    label: "Settings",
    description: "Preferences & theme",
    icon: Settings,
    accent: "bg-secondary text-foreground",
  },
];

type QuickActionsProps = {
  className?: string;
};

export function QuickActions({ className }: QuickActionsProps) {
  return (
    <Stagger
      className={cn(
        "grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3",
        className,
      )}
    >
      {actions.map((action) => (
        <StaggerItem key={action.href}>
          <Link
            href={action.href}
            className="group block rounded-[1.35rem] border border-border/50 bg-card/80 p-3.5 shadow-soft backdrop-blur-xl transition-all active:scale-[0.98] sm:rounded-3xl sm:p-4 hover:-translate-y-0.5 hover:shadow-glass"
          >
            <div
              className={cn(
                "mb-3 flex size-10 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105",
                action.accent,
              )}
            >
              <action.icon className="size-4" />
            </div>
            <p className="text-sm font-semibold">{action.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {action.description}
            </p>
          </Link>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

export function ActivityDirectionIcon({
  direction,
}: {
  direction: "in" | "out" | "neutral";
}) {
  if (direction === "in") {
    return <ArrowDownLeft className="size-4 text-success" />;
  }
  if (direction === "out") {
    return <ArrowUpRight className="size-4 text-destructive" />;
  }
  return <History className="size-4 text-muted-foreground" />;
}
