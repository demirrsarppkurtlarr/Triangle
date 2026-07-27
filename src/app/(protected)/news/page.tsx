import { redirect } from "next/navigation";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { MarketNewsList } from "@/features/market-news/components/market-news-list";
import { getMarketNews } from "@/features/market-news/services/news.service";
import { getRequestDictionary } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export default async function NewsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { locale, t } = await getRequestDictionary();
  const items = await getMarketNews(locale, 30);

  return (
    <>
      <DashboardHeader title={t.news.title} description={t.news.description} />
      <main className="mx-auto max-w-3xl page-pad py-6 md:py-8">
        <MarketNewsList items={items} />
      </main>
    </>
  );
}
