import { redirect } from "next/navigation";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { LeaderboardTable } from "@/features/leaderboard/components/leaderboard-table";
import { getLeaderboard } from "@/features/leaderboard/services/leaderboard.service";
import { getRequestDictionary } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { t } = await getRequestDictionary();
  const rows = await getLeaderboard(user.id, 50);

  return (
    <>
      <DashboardHeader
        title={t.leaderboard.title}
        description={t.leaderboard.description}
      />
      <main className="mx-auto max-w-6xl page-pad py-6 md:py-8">
        <LeaderboardTable rows={rows} />
      </main>
    </>
  );
}
