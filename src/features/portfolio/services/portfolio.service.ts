import type { PortfolioHolding } from "@/features/stocks/services/market.service";
import { getPortfolioHoldings } from "@/features/stocks/services/market.service";
import { createClient } from "@/lib/supabase/server";

export type PortfolioSummary = {
  totalValue: number;
  totalCost: number;
  totalPnl: number;
  totalPnlPercent: number;
  holdingsCount: number;
  cashBalance: number;
  dayWeight: number;
};

export type TradeHistoryItem = {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  total: number;
  executed_at: string;
};

export async function getPortfolioSummary(userId: string): Promise<{
  summary: PortfolioSummary;
  holdings: PortfolioHolding[];
  trades: TradeHistoryItem[];
}> {
  const supabase = await createClient();

  const [holdings, { data: account }, { data: trades }] = await Promise.all([
    getPortfolioHoldings(userId),
    supabase
      .from("bank_accounts")
      .select("balance")
      .eq("user_id", userId)
      .single(),
    supabase
      .from("trades")
      .select("id, symbol, side, quantity, price, total, executed_at")
      .eq("user_id", userId)
      .order("executed_at", { ascending: false })
      .limit(12),
  ]);

  const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.costBasis, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  const cashBalance = Number(account?.balance ?? 0);

  return {
    summary: {
      totalValue,
      totalCost,
      totalPnl,
      totalPnlPercent,
      holdingsCount: holdings.length,
      cashBalance,
      dayWeight: totalValue + cashBalance > 0
        ? (totalValue / (totalValue + cashBalance)) * 100
        : 0,
    },
    holdings: holdings.sort((a, b) => b.marketValue - a.marketValue),
    trades: (trades ?? []).map((t) => ({
      id: t.id,
      symbol: t.symbol,
      side: t.side as "buy" | "sell",
      quantity: Number(t.quantity),
      price: Number(t.price),
      total: Number(t.total),
      executed_at: t.executed_at,
    })),
  };
}
