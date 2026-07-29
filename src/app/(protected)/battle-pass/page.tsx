import { redirect } from "next/navigation";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { BattlePassHub } from "@/features/battle-pass/components/battle-pass-hub";
import { getSeasonData } from "@/features/battle-pass/services/season.service";
import { getRequestDictionary } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export default async function BattlePassPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { locale } = await getRequestDictionary();
  const data = await getSeasonData(user.id, locale);

  if (!data) {
    return (
      <>
        <DashboardHeader title="Battle Pass" description="Sezon görevleri" />
        <main className="mx-auto max-w-3xl page-pad py-6 md:py-8">
          <div className="rounded-[1.35rem] border border-dashed border-border/70 bg-card/50 px-6 py-10 text-center">
            <p className="text-sm font-medium">Aktif sezon yok</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Yeni sezon yakında başlayacak.
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <DashboardHeader
        title="Battle Pass"
        description={`${data.season.name} · Görevleri tamamla, XP kazan, seviye atla`}
      />
      <main className="mx-auto max-w-3xl page-pad py-6 md:py-8">
        <BattlePassHub {...data} />
      </main>
    </>
  );
}
