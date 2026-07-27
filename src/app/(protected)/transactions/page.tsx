import { redirect } from "next/navigation";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { RecentActivity } from "@/features/dashboard/components/recent-activity";
import {
  getAllTransactions,
  getDashboardData,
} from "@/features/dashboard/services/dashboard.service";
import { createClient } from "@/lib/supabase/server";

export default async function TransactionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const data = await getDashboardData(user.id);
  if (!data) redirect("/login");

  const transactions = await getAllTransactions(user.id, data.account.id);

  return (
    <>
      <DashboardHeader
        title="Activity"
        description="Complete history of your virtual transactions"
      />
      <main className="mx-auto max-w-3xl page-pad py-6 md:py-8">
        <RecentActivity items={transactions} showViewAll={false} />
      </main>
    </>
  );
}
