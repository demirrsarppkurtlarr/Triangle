import { redirect } from "next/navigation";
import Link from "next/link";

import { LiveBalanceHero } from "@/features/dashboard/components/live-balance-hero";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardMotion } from "@/features/dashboard/components/dashboard-motion";
import { LiveRecentActivity } from "@/features/dashboard/components/live-recent-activity";
import { NotificationsPreview } from "@/features/dashboard/components/notifications-preview";
import { QuickActions } from "@/features/dashboard/components/quick-actions";
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
import { createClient } from "@/lib/supabase/server";
import { ADMIN_USERNAME } from "@/utils/constants";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const data = await getDashboardData(user.id);
  if (!data) redirect("/login");

  const greeting = data.profile.full_name || data.profile.username;

  return (
    <>
      <DashboardHeader
        title={`Welcome back, ${greeting}`}
        description="Game cash · stocks · shop · player marketplace"
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
              <Card className="glass-panel border-border/50">
                <CardHeader>
                  <CardTitle>Game start</CardTitle>
                  <CardDescription>
                    New accounts begin with $1000 game cash. Trade simulated
                    stocks or spend in the shop.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button asChild>
                    <Link href="/shop">Open shop</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/stocks">Simulated market</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass-panel border-border/50">
                <CardHeader>
                  <CardTitle>Find people</CardTitle>
                  <CardDescription>
                    Search by Triangle ID or username before sending money.
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
                      <CardTitle>Administrator access</CardTitle>
                      <CardDescription>
                        You have server-enforced admin privileges.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild>
                        <Link href="/admin">Open admin panel</Link>
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
