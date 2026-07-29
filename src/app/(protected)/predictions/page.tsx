import { redirect } from "next/navigation";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { PredictionsHub } from "@/features/predictions/components/predictions-hub";
import { getPredictionsData } from "@/features/predictions/services/prediction.service";
import { createClient } from "@/lib/supabase/server";

export default async function PredictionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getPredictionsData(user.id);

  return (
    <>
      <DashboardHeader
        title="Tahminler"
        description="Hisse yükselir mi düşer mi? Tahmin et, kazan!"
      />
      <main className="mx-auto max-w-3xl page-pad py-6 md:py-8">
        <PredictionsHub {...data} />
      </main>
    </>
  );
}
