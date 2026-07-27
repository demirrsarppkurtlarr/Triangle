import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { HoldingsPreview } from "@/features/stocks/components/holdings-preview";
import { RefreshPricesButton } from "@/features/stocks/components/refresh-prices-button";
import { StockTable } from "@/features/stocks/components/stock-table";
import {
  getMarketList,
  getPortfolioHoldings,
  ensureFreshPrices,
} from "@/features/stocks/services/market.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function StocksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const quotes = await ensureFreshPrices();
  const [{ stocks, marketLabel, isOpen }, holdings] = await Promise.all([
    getMarketList(user.id, quotes),
    getPortfolioHoldings(user.id, quotes),
  ]);

  return (
    <>
      <DashboardHeader
        title="Market"
        description="US equities · virtual trading · live Twelve Data"
      />
      <main className="relative mx-auto max-w-6xl space-y-8 page-pad py-6 md:py-8">
        <div
          className="pointer-events-none absolute inset-x-0 -top-8 h-56 bg-[radial-gradient(ellipse_at_top,_rgba(6,182,212,0.1),_transparent_55%)]"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-medium shadow-soft backdrop-blur-md",
              isOpen
                ? "bg-success/10 text-success"
                : "bg-card/70 text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "size-2 rounded-full",
                isOpen ? "animate-pulse bg-success" : "bg-muted-foreground",
              )}
            />
            {marketLabel}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/portfolio"
              className="inline-flex h-9 items-center gap-1.5 rounded-2xl border border-border/60 bg-card/80 px-4 text-sm font-medium shadow-soft backdrop-blur-sm transition-colors hover:bg-secondary"
            >
              Portfolio
              <ArrowUpRight className="size-3.5" />
            </Link>
            <RefreshPricesButton />
          </div>
        </div>

        <div className="relative z-10 grid gap-8 lg:grid-cols-5">
          <div className="space-y-8 lg:col-span-3">
            <section className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Watchlist
                </h2>
                <p className="text-sm text-muted-foreground">
                  Tap a symbol to buy or sell with virtual cash
                </p>
              </div>
              <StockTable stocks={stocks} />
            </section>

            <section className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Favorites
                </h2>
                <p className="text-sm text-muted-foreground">
                  Star symbols to keep them close
                </p>
              </div>
              <StockTable stocks={stocks} favoritesOnly />
            </section>
          </div>

          <div className="lg:col-span-2">
            <Card className="glass-panel sticky top-6 border-border/50">
              <CardHeader>
                <CardTitle>Holdings snapshot</CardTitle>
                <CardDescription>
                  Full Apple-style portfolio view available
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <HoldingsPreview holdings={holdings} />
                <Link
                  href="/portfolio"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-secondary px-4 py-3 text-sm font-medium transition-colors hover:bg-secondary/80"
                >
                  View portfolio
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
