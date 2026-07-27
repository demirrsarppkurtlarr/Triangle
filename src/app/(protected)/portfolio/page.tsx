import { redirect } from "next/navigation";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { LivePortfolioView } from "@/features/portfolio/components/live-portfolio-view";
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
        description="Live virtual investments · updates every tick"
      />
      <main className="relative mx-auto max-w-5xl space-y-8 page-pad py-6 md:py-8">
        <div
          className="pointer-events-none absolute inset-x-0 -top-10 h-64 bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.08),_transparent_60%)]"
          aria-hidden="true"
        />

        <div className="relative z-10 flex justify-end">
          <RefreshPricesButton />
        </div>

        <div className="relative z-10">
          <LivePortfolioView
            summary={summary}
            holdings={holdings}
            trades={trades}
          />
        </div>
      </main>
    </>
  );
}
