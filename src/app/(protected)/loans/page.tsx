import { redirect } from "next/navigation";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { LoansHub } from "@/features/loans/components/loans-hub";
import { getLoansData } from "@/features/loans/services/loan.service";
import { createClient } from "@/lib/supabase/server";

export default async function LoansPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getLoansData(user.id);

  return (
    <>
      <DashboardHeader
        title="Krediler"
        description="Kredi çek · taksitle öde · kredi skorunu yükselt"
      />
      <main className="mx-auto max-w-3xl page-pad py-6 md:py-8">
        <LoansHub {...data} />
      </main>
    </>
  );
}
