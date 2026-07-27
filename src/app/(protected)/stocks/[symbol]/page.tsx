import { notFound, redirect } from "next/navigation";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { StockDetailLive } from "@/features/stocks/components/stock-detail-live";
import { getComparisonBaselines } from "@/features/stocks/services/comparison.service";
import {
  getPriceHistory,
  getStockDetail,
  ensureFreshPrices,
} from "@/features/stocks/services/market.service";
import { createClient } from "@/lib/supabase/server";

type StockDetailPageProps = {
  params: Promise<{ symbol: string }>;
};

export default async function StockDetailPage({ params }: StockDetailPageProps) {
  const { symbol: raw } = await params;
  const symbol = raw.toUpperCase();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await ensureFreshPrices();
  const detail = await getStockDetail(symbol, user.id);
  if (!detail) notFound();

  const [{ data: account }, chartData, baselines] = await Promise.all([
    supabase
      .from("bank_accounts")
      .select("balance")
      .eq("user_id", user.id)
      .single(),
    getPriceHistory(symbol, 120),
    getComparisonBaselines(symbol, detail.price),
  ]);

  return (
    <>
      <DashboardHeader
        title={detail.symbol}
        description={`${detail.name} · ${detail.exchange}`}
      />
      <main className="mx-auto max-w-5xl page-pad py-6 md:py-8">
        <StockDetailLive
          symbol={detail.symbol}
          name={detail.name}
          basePrice={detail.price}
          marketLabel={detail.market.label}
          recordedAt={detail.recordedAt}
          chartData={chartData}
          availableCash={Number(account?.balance ?? 0)}
          holding={detail.holding}
          baselines={{
            day: baselines.day,
            week: baselines.week,
            month: baselines.month,
          }}
        />
      </main>
    </>
  );
}
