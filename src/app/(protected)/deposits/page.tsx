import { redirect } from "next/navigation";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DepositsHub } from "@/features/deposits/components/deposits-hub";
import { getDepositsData } from "@/features/deposits/services/deposit.service";
import { createClient } from "@/lib/supabase/server";

export default async function DepositsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getDepositsData(user.id);

  return (
    <>
      <DashboardHeader
        title="Vadeli Mevduat"
        description="Paranı kilitle · vade sonunda faizle birlikte al"
      />
      <main className="mx-auto max-w-3xl page-pad py-6 md:py-8">
        <DepositsHub {...data} />
      </main>
    </>
  );
}
