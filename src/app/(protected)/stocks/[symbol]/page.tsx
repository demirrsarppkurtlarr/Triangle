import { notFound, redirect } from "next/navigation";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { StockChart } from "@/features/stocks/components/stock-chart";
import { StockDetailPrice } from "@/features/stocks/components/stock-detail-price";
import { TradeForm } from "@/features/stocks/components/trade-form";
import {
  getPriceHistory,
  getStockDetail,
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
import { formatCurrency } from "@/utils/format";

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

  const [{ data: account }, chartData] = await Promise.all([
    supabase
      .from("bank_accounts")
      .select("balance")
      .eq("user_id", user.id)
      .single(),
    getPriceHistory(symbol),
  ]);

  return (
    <>
      <DashboardHeader
        title={detail.symbol}
        description={`${detail.name} · ${detail.exchange}`}
      />
      <main className="mx-auto max-w-5xl space-y-8 page-pad py-6 md:py-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <StockDetailPrice
            price={detail.price}
            changeAmount={detail.changeAmount}
            changePercent={detail.changePercent}
            marketLabel={detail.market.label}
            recordedAt={detail.recordedAt}
          />
          {detail.holding && (
            <div className="rounded-2xl bg-secondary/70 px-4 py-3 text-sm">
              <p className="text-muted-foreground">You own</p>
              <p className="font-semibold">
                {detail.holding.quantity} shares · avg{" "}
                {formatCurrency(detail.holding.averageCost)}
              </p>
            </div>
          )}
        </div>

        <StockChart data={chartData} symbol={symbol} />

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle>Buy</CardTitle>
              <CardDescription>
                Virtual purchase · cash deducted from your TriangleBank balance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TradeForm
                symbol={symbol}
                price={detail.price}
                availableCash={Number(account?.balance ?? 0)}
                ownedQuantity={detail.holding?.quantity ?? 0}
                side="buy"
              />
            </CardContent>
          </Card>

          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle>Sell</CardTitle>
              <CardDescription>
                Virtual sale · proceeds credited to your balance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TradeForm
                symbol={symbol}
                price={detail.price}
                availableCash={Number(account?.balance ?? 0)}
                ownedQuantity={detail.holding?.quantity ?? 0}
                side="sell"
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
