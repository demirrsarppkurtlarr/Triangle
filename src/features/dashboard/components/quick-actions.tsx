"use client";

import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Bitcoin,
  Briefcase,
  CreditCard,
  Gift,
  History,
  MessageCircle,
  Newspaper,
  Package,
  Send,
  ShoppingBag,
  Star,
  Store,
  Target,
  Trophy,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

type QuickActionsProps = {
  className?: string;
};

export function QuickActions({ className }: QuickActionsProps) {
  const { t } = useI18n();

  const actions = [
    {
      href: "/rewards",
      label: t.nav.rewards,
      description: t.rewards.description,
      icon: Gift,
      accent: "bg-primary/10 text-primary",
    },
    {
      href: "/shop",
      label: t.nav.shop,
      description: "Cars, homes, gadgets",
      icon: ShoppingBag,
      accent: "bg-primary/10 text-primary",
    },
    {
      href: "/stocks",
      label: t.nav.market,
      description: t.news.description,
      icon: TrendingUp,
      accent: "bg-accent/10 text-accent",
    },
    {
      href: "/news",
      label: t.nav.news,
      description: t.news.description,
      icon: Newspaper,
      accent: "bg-accent/10 text-accent",
    },
    {
      href: "/leaderboard",
      label: t.nav.leaderboard,
      description: t.leaderboard.description,
      icon: Trophy,
      accent: "bg-success/10 text-success",
    },
    {
      href: "/marketplace",
      label: t.nav.marketplace,
      description: "Player item trades",
      icon: Store,
      accent: "bg-success/10 text-success",
    },
    {
      href: "/inventory",
      label: t.nav.inventory,
      description: t.inventory.title,
      icon: Package,
      accent: "bg-secondary text-foreground",
    },
    {
      href: "/transfer",
      label: t.nav.send,
      description: t.transfer.description,
      icon: Send,
      accent: "bg-secondary text-foreground",
    },
    {
      href: "/portfolio",
      label: t.nav.portfolio,
      description: "Stock holdings",
      icon: Briefcase,
      accent: "bg-secondary text-foreground",
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
      label: t.nav.alerts,
      description: t.nav.notifications,
      icon: Bell,
      accent: "bg-secondary text-foreground",
    },
    {
      href: "/crypto",
      label: "Kripto",
      description: "Sanal kripto al-sat",
      icon: Bitcoin,
      accent: "bg-accent/10 text-accent",
    },
    {
      href: "/forex",
      label: "Döviz",
      description: "Döviz piyasası",
      icon: Wallet,
      accent: "bg-accent/10 text-accent",
    },
    {
      href: "/loans",
      label: "Kredi",
      description: "Sanal kredi çek",
      icon: CreditCard,
      accent: "bg-primary/10 text-primary",
    },
    {
      href: "/predictions",
      label: "Tahmin",
      description: "Piyasa tahmini yap",
      icon: Target,
      accent: "bg-success/10 text-success",
    },
    {
      href: "/battle-pass",
      label: "Battle Pass",
      description: "Sezon görevleri",
      icon: Star,
      accent: "bg-primary/10 text-primary",
    },
    {
      href: "/chat",
      label: "Sohbet",
      description: "Oyuncularla konuş",
      icon: MessageCircle,
      accent: "bg-secondary text-foreground",
    },
  ];

  return (
    <Stagger
      className={cn(
        "grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4",
        className,
      )}
    >
      {actions.map((action) => (
        <StaggerItem key={action.href + action.label}>
          <Link
            href={action.href}
            prefetch
            className="group flex min-h-[4.75rem] flex-col justify-between rounded-[1.25rem] border border-border/50 bg-card/80 p-3.5 shadow-soft backdrop-blur-xl transition-transform active:scale-[0.98] sm:min-h-[5.25rem] sm:p-4"
          >
            <div
              className={cn(
                "mb-2 flex size-9 items-center justify-center rounded-xl sm:size-10",
                action.accent,
              )}
            >
              <action.icon className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">
                {action.label}
              </p>
              <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground sm:text-xs">
                {action.description}
              </p>
            </div>
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
