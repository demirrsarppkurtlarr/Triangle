import { redirect } from "next/navigation";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { CryptoHub } from "@/features/crypto/components/crypto-hub";
import { getCryptoData } from "@/features/crypto/services/crypto.service";
import { createClient } from "@/lib/supabase/server";

export default async function CryptoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getCryptoData(user.id);

  return (
    <>
      <DashboardHeader
        title="Kripto"
        description="TriCoin, BlockGem, NeonChain — sanal kripto al-sat"
      />
      <main className="mx-auto max-w-4xl page-pad py-6 md:py-8">
        <CryptoHub {...data} />
      </main>
    </>
  );
}
