import { redirect } from "next/navigation";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { InsuranceHub } from "@/features/insurance/components/insurance-hub";
import { getInsuranceData } from "@/features/insurance/services/insurance.service";
import { createClient } from "@/lib/supabase/server";

export default async function InsurancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getInsuranceData(user.id);

  return (
    <>
      <DashboardHeader
        title="Sigorta"
        description="Hesap, hisse ve kripto sigortası"
      />
      <main className="mx-auto max-w-3xl page-pad py-6 md:py-8">
        <InsuranceHub {...data} />
      </main>
    </>
  );
}
