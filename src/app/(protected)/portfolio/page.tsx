import { redirect } from "next/navigation";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { AllocationBars } from "@/features/portfolio/components/allocation-bars";
import { HoldingCards } from "@/features/portfolio/components/holding-cards";
import { PortfolioHero } from "@/features/portfolio/components/portfolio-hero";
import { RecentTrades } from "@/features/portfolio/components/recent-trades";
import { RefreshPricesButton } from "@/features/stocks/components/refresh-prices-button";
import { getPortfolioSummary } from "@/features/portfolio/services/portfolio.service";
import { createClient } from "@/lib/supabase/server";

export default async function PortfolioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { summary, holdings, trades } = await getPortfolioSummary(user.id);

  return (
    <>
      <DashboardHeader
        title="Portfolio"
        description="Your virtual investments · Apple Card simplicity"
      />
      <main className="relative mx-auto max-w-5xl space-y-8 page-pad py-6 md:py-8">
        <div
          className="pointer-events-none absolute inset-x-0 -top-10 h-64 bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.08),_transparent_60%)]"
          aria-hidden="true"
        />

        <div className="relative z-10 flex justify-end">
          <RefreshPricesButton />
        </div>

        <div className="relative z-10 space-y-8">
          <PortfolioHero summary={summary} />

          <div className="grid gap-8 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Holdings
                </h2>
                <p className="text-sm text-muted-foreground">
                  Simulated value · average cost basis
                </p>
              </div>
              <HoldingCards
                holdings={holdings}
                totalValue={summary.totalValue}
              />
            </div>

            <div className="space-y-6 lg:col-span-2">
              <AllocationBars
                holdings={holdings}
                totalValue={summary.totalValue}
              />
              <RecentTrades trades={trades} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
