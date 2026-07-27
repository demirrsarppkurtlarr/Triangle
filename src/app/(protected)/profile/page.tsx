import { redirect } from "next/navigation";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { getDashboardData } from "@/features/dashboard/services/dashboard.service";
import { TriangleIdCard } from "@/features/triangle-id/components/triangle-id-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const data = await getDashboardData(user.id);
  if (!data) redirect("/login");

  return (
    <>
      <DashboardHeader
        title={data.profile.full_name || data.profile.username}
        description="Your TriangleBank identity"
        username={data.profile.username}
      />

      <main className="mx-auto max-w-3xl space-y-6 page-pad py-6 md:py-8">
        <TriangleIdCard
          triangleId={data.profile.triangle_id}
          username={data.profile.username}
        />

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Account details</CardTitle>
            <CardDescription>
              Virtual account information for this simulation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between gap-4 border-b border-border/50 pb-3">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{data.profile.email}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-border/50 pb-3">
              <span className="text-muted-foreground">Account number</span>
              <span className="font-mono font-medium">
                {data.account.account_number}
              </span>
            </div>
            <div className="flex justify-between gap-4 border-b border-border/50 pb-3">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium capitalize">
                {data.profile.is_frozen ? "Frozen" : data.account.status}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium">
                {data.profile.is_admin ? "Administrator" : "Member"}
              </span>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
