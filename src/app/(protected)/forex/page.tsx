import { redirect } from "next/navigation";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { ForexHub } from "@/features/forex/components/forex-hub";
import { getForexData } from "@/features/forex/services/forex.service";
import { createClient } from "@/lib/supabase/server";

export default async function ForexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getForexData(user.id);

  return (
    <>
      <DashboardHeader
        title="Döviz Piyasası"
        description="EUR, GBP, JPY, TRY — sanal döviz al-sat"
      />
      <main className="mx-auto max-w-4xl page-pad py-6 md:py-8">
        <ForexHub {...data} />
      </main>
    </>
  );
}
