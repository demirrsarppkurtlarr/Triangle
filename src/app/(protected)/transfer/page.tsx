import { redirect } from "next/navigation";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { TransferForm } from "@/features/transfers/components/transfer-form";
import {
  getDailyTransferTotal,
  getTransferLimits,
} from "@/features/transfers/services/transfer.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/utils/format";

export default async function TransferPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("triangle_id, is_frozen")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  if (profile.is_frozen) {
    return (
      <>
        <DashboardHeader
          title="Send money"
          description="Your account is currently frozen"
        />
        <main className="mx-auto max-w-2xl page-pad py-6 md:py-8">
          <Card className="glass-panel border-destructive/30">
            <CardHeader>
              <CardTitle>Transfers unavailable</CardTitle>
              <CardDescription>
                Your account has been frozen. Contact support for assistance.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </>
    );
  }

  const [limits, dailyUsed] = await Promise.all([
    getTransferLimits(),
    getDailyTransferTotal(user.id),
  ]);

  const { data: account } = await supabase
    .from("bank_accounts")
    .select("balance, currency")
    .eq("user_id", user.id)
    .single();

  return (
    <>
      <DashboardHeader
        title="Send money"
        description="Virtual transfers only — no real money involved"
      />
      <main className="mx-auto max-w-2xl space-y-6 page-pad py-6 md:py-8">
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardDescription>Available balance</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(Number(account?.balance ?? 0), account?.currency)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle>New transfer</CardTitle>
            <CardDescription>
              Send virtual money instantly using a Triangle ID.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TransferForm
              singleLimit={limits.singleLimit}
              dailyLimit={limits.dailyLimit}
              dailyUsed={dailyUsed}
              ownTriangleId={profile.triangle_id}
            />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
