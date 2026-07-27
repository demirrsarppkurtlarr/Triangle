import { redirect } from "next/navigation";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { SettingsPanels } from "@/features/settings/components/settings-panels";
import { getUserPreferences } from "@/features/settings/services/settings.service";
import { getRequestDictionary } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { t } = await getRequestDictionary();
  const preferences = await getUserPreferences(user.id);

  return (
    <>
      <DashboardHeader
        title={t.settings.title}
        description={t.settings.description}
      />
      <main className="mx-auto max-w-2xl page-pad py-6 md:py-8">
        <SettingsPanels preferences={preferences} />
      </main>
    </>
  );
}
