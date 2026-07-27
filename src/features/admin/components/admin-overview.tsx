"use client";

import Link from "next/link";
import {
  ArrowLeftRight,
  Coins,
  Snowflake,
  Users,
  Wallet,
} from "lucide-react";

import { MintForm } from "@/features/admin/components/mint-form";
import { MotionCard } from "@/components/motion/pressable";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AdminOverviewProps = {
  stats: {
    totalUsers: number;
    frozenUsers: number;
    activeAccounts: number;
    totalVolume: number;
    totalTransfers: number;
    totalMinted: number;
  };
  formatCurrency: (n: number) => string;
};

export function AdminOverview({ stats, formatCurrency }: AdminOverviewProps) {
  const cards = [
    {
      label: "Users",
      value: String(stats.totalUsers),
      hint: `${stats.frozenUsers} frozen`,
      icon: Users,
    },
    {
      label: "Active accounts",
      value: String(stats.activeAccounts),
      hint: "Status = active",
      icon: Wallet,
    },
    {
      label: "Transfer volume",
      value: formatCurrency(stats.totalVolume),
      hint: `${stats.totalTransfers} completed`,
      icon: ArrowLeftRight,
    },
    {
      label: "Total minted",
      value: formatCurrency(stats.totalMinted),
      hint: "Admin mint",
      icon: Coins,
    },
  ];

  return (
    <div className="space-y-8">
      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" fast>
        {cards.map((card, index) => (
          <StaggerItem key={card.label}>
            <MotionCard delay={index * 0.04}>
              <Card className="glass-panel border-border/50 transition-shadow duration-300 hover:shadow-glass">
                <CardHeader className="pb-2">
                  <div className="mb-2 flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-105">
                    <card.icon className="size-4" />
                  </div>
                  <CardDescription>{card.label}</CardDescription>
                  <CardTitle className="text-2xl tracking-tight">
                    {card.value}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{card.hint}</p>
                </CardContent>
              </Card>
            </MotionCard>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="grid gap-6 lg:grid-cols-2">
        <MotionCard delay={0.12}>
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle>Mint virtual money</CardTitle>
              <CardDescription>
                Credits a user balance via server-side admin_mint_funds RPC.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MintForm />
            </CardContent>
          </Card>
        </MotionCard>

        <MotionCard delay={0.16}>
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle>Quick links</CardTitle>
              <CardDescription>Manage the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                {
                  href: "/admin/users",
                  icon: Users,
                  label: "View and freeze users",
                },
                {
                  href: "/admin/transfers",
                  icon: ArrowLeftRight,
                  label: "Inspect all transfers",
                },
                {
                  href: "/admin/limits",
                  icon: Snowflake,
                  label: "Adjust transfer limits",
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  className="group flex items-center gap-3 rounded-2xl bg-secondary/60 px-4 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:bg-secondary hover:shadow-soft"
                >
                  <item.icon className="size-4 text-primary transition-transform duration-300 group-hover:scale-110" />
                  {item.label}
                </Link>
              ))}
            </CardContent>
          </Card>
        </MotionCard>
      </div>
    </div>
  );
}
