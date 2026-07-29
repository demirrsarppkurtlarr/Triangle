import { redirect } from "next/navigation";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { ThemesHub } from "@/features/themes/components/themes-hub";
import { getThemesData } from "@/features/themes/services/theme.service";
import { getRequestDictionary } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export default async function ThemesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { locale } = await getRequestDictionary();
  const data = await getThemesData(user.id);

  return (
    <>
      <DashboardHeader
        title="Temalar"
        description="Özel temalar satın al ve arayüzünü kişiselleştir"
      />
      <main className="mx-auto max-w-4xl page-pad py-6 md:py-8">
        <ThemesHub {...data} locale={locale} />
      </main>
    </>
  );
}
