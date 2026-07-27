import { redirect } from "next/navigation";
import Link from "next/link";

import { LiveBalanceHero } from "@/features/dashboard/components/live-balance-hero";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardMotion } from "@/features/dashboard/components/dashboard-motion";
import { LiveRecentActivity } from "@/features/dashboard/components/live-recent-activity";
import { NotificationsPreview } from "@/features/dashboard/components/notifications-preview";
import { QuickActions } from "@/features/dashboard/components/quick-actions";
import { DailyRewardCard } from "@/features/rewards/components/daily-reward-card";
import { getDailyRewardStatus } from "@/features/rewards/services/rewards.service";
import { TriangleIdSearch } from "@/features/triangle-id/components/triangle-id-search";
import { getDashboardData } from "@/features/dashboard/services/dashboard.service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getRequestDictionary } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_USERNAME } from "@/utils/constants";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { t } = await getRequestDictionary();
  const [data, rewardStatus] = await Promise.all([
    getDashboardData(user.id),
    getDailyRewardStatus(),
  ]);
  if (!data) redirect("/login");

  const greeting = data.profile.full_name || data.profile.username;

  return (
    <>
      <DashboardHeader
        title={`${t.dashboard.welcome}, ${greeting}`}
        description={t.dashboard.subtitle}
        username={data.profile.username}
      />

      <main className="mx-auto max-w-6xl page-pad py-6 md:py-8">
        <DashboardMotion
          hero={
            <LiveBalanceHero
              key={data.account.id}
              profile={data.profile}
              account={data.account}
            />
          }
          actions={<QuickActions />}
          primary={
            <LiveRecentActivity
              key={`${user.id}-${data.account.id}`}
              userId={user.id}
              accountId={data.account.id}
              initialItems={data.recentActivity}
            />
          }
          secondary={
            <NotificationsPreview
              items={data.notifications}
              unreadCount={data.unreadCount}
            />
          }
          extras={
            <div className="space-y-8">
              {rewardStatus && (
                <DailyRewardCard status={rewardStatus} compact />
              )}

              <div className="grid gap-3 sm:grid-cols-3">
                <Button asChild className="min-h-11">
                  <Link href="/rewards">{t.dashboard.claimReward}</Link>
                </Button>
                <Button asChild variant="outline" className="min-h-11">
                  <Link href="/leaderboard">{t.dashboard.openLeaderboard}</Link>
                </Button>
                <Button asChild variant="outline" className="min-h-11">
                  <Link href="/news">{t.dashboard.openNews}</Link>
                </Button>
              </div>

              <Card className="glass-panel border-border/50">
                <CardHeader>
                  <CardTitle>{t.dashboard.gameStart}</CardTitle>
                  <CardDescription>{t.dashboard.gameStartBody}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button asChild>
                    <Link href="/shop">{t.nav.shop}</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/stocks">{t.nav.market}</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass-panel border-border/50">
                <CardHeader>
                  <CardTitle>{t.dashboard.findPeople}</CardTitle>
                  <CardDescription>
                    {t.dashboard.findPeopleBody}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TriangleIdSearch />
                </CardContent>
              </Card>

              {data.profile.is_admin &&
                data.profile.username === ADMIN_USERNAME && (
                  <Card className="glass-panel border-primary/20">
                    <CardHeader>
                      <CardTitle>{t.nav.admin}</CardTitle>
                      <CardDescription>
                        Server-enforced admin privileges.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild>
                        <Link href="/admin">{t.nav.admin}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
            </div>
          }
        />
      </main>
    </>
  );
}
