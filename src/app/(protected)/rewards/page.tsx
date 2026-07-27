import { redirect } from "next/navigation";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DailyRewardCard } from "@/features/rewards/components/daily-reward-card";
import { getDailyRewardStatus } from "@/features/rewards/services/rewards.service";
import { getRequestDictionary } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export default async function RewardsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { t } = await getRequestDictionary();
  const status = await getDailyRewardStatus();

  return (
    <>
      <DashboardHeader title={t.rewards.title} description={t.rewards.description} />
      <main className="mx-auto max-w-2xl page-pad py-6 md:py-8">
        {status ? (
          <DailyRewardCard status={status} />
        ) : (
          <p className="rounded-3xl border border-dashed border-border/70 px-6 py-10 text-center text-sm text-muted-foreground">
            Run phase-17 SQL to enable daily rewards.
          </p>
        )}
      </main>
    </>
  );
}
