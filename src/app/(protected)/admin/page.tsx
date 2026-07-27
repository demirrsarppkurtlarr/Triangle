import Link from "next/link";
import {
  ArrowLeftRight,
  Coins,
  Snowflake,
  Users,
  Wallet,
} from "lucide-react";

import { MintForm } from "@/features/admin/components/mint-form";
import {
  getAdminStats,
} from "@/features/admin/services/admin.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/utils/format";

export default async function AdminOverviewPage() {
  const stats = await getAdminStats();

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label} className="glass-panel border-border/50">
            <CardHeader className="pb-2">
              <div className="mb-2 flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <card.icon className="size-4" />
              </div>
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-2xl">{card.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{card.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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

        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
            <CardDescription>Manage the platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Link
              href="/admin/users"
              className="flex items-center gap-3 rounded-2xl bg-secondary/60 px-4 py-3 transition-colors hover:bg-secondary"
            >
              <Users className="size-4 text-primary" />
              View and freeze users
            </Link>
            <Link
              href="/admin/transfers"
              className="flex items-center gap-3 rounded-2xl bg-secondary/60 px-4 py-3 transition-colors hover:bg-secondary"
            >
              <ArrowLeftRight className="size-4 text-primary" />
              Inspect all transfers
            </Link>
            <Link
              href="/admin/limits"
              className="flex items-center gap-3 rounded-2xl bg-secondary/60 px-4 py-3 transition-colors hover:bg-secondary"
            >
              <Snowflake className="size-4 text-primary" />
              Adjust transfer limits
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
