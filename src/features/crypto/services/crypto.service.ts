import "server-only";

import { createClient } from "@/lib/supabase/server";

export type CryptoAsset = {
  symbol: string;
  name: string;
  price: number;
  prevPrice: number;
  change: number;
  changePct: number;
  volatility: number;
};

export type CryptoHolding = {
  symbol: string;
  quantity: number;
  averageCost: number;
  currentValue: number;
  pnl: number;
};

export async function getCryptoData(userId: string) {
  const supabase = await createClient();

  const [{ data: assets }, { data: holdings }, { data: account }] =
    await Promise.all([
      supabase.from("crypto_assets").select("*").eq("is_active", true).order("symbol"),
      supabase.from("crypto_holdings").select("*").eq("user_id", userId),
      supabase.from("bank_accounts").select("balance").eq("user_id", userId).maybeSingle(),
    ]);

  const priceMap = new Map((assets ?? []).map((a) => [a.symbol, Number(a.price)]));

  return {
    assets: (assets ?? []).map((a) => {
      const price = Number(a.price);
      const prev = Number(a.prev_price);
      return {
        symbol: a.symbol,
        name: a.name,
        price,
        prevPrice: prev,
        change: price - prev,
        changePct: prev > 0 ? ((price - prev) / prev) * 100 : 0,
        volatility: Number(a.volatility),
      };
    }),
    holdings: (holdings ?? [])
      .filter((h) => Number(h.quantity) > 0)
      .map((h) => {
        const qty = Number(h.quantity);
        const avg = Number(h.average_cost);
        const current = (priceMap.get(h.symbol) ?? avg) * qty;
        return {
          symbol: h.symbol,
          quantity: qty,
          averageCost: avg,
          currentValue: current,
          pnl: current - avg * qty,
        };
      }),
    cash: Number(account?.balance ?? 0),
  };
}
