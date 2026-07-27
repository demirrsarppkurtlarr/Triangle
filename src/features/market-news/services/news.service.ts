import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n/dictionaries";

export type MarketNewsItem = {
  id: string;
  slug: string;
  title: string;
  body: string;
  sentiment: "bullish" | "bearish" | "neutral";
  impactPercent: number;
  symbols: string[];
  publishedAt: string;
  appliedAt: string | null;
};

export async function getMarketNews(
  locale: Locale,
  limit = 20,
): Promise<MarketNewsItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("market_news")
    .select(
      "id, slug, title_en, title_tr, body_en, body_tr, sentiment, impact_percent, symbols, published_at, applied_at",
    )
    .eq("is_active", true)
    .order("published_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: locale === "tr" ? row.title_tr : row.title_en,
    body: locale === "tr" ? row.body_tr : row.body_en,
    sentiment: (row.sentiment ?? "neutral") as MarketNewsItem["sentiment"],
    impactPercent: Number(row.impact_percent),
    symbols: Array.isArray(row.symbols) ? row.symbols : [],
    publishedAt: row.published_at,
    appliedAt: row.applied_at,
  }));
}

export async function applyPendingMarketNews() {
  const supabase = await createClient();
  return supabase.rpc("apply_market_news");
}
