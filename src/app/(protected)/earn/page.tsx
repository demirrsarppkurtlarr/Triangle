import { redirect } from "next/navigation";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { EarnHub } from "@/features/earn/components/earn-hub";
import { getEarnStatus } from "@/features/earn/services/earn.service";
import { getRequestDictionary } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export default async function EarnPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { locale } = await getRequestDictionary();

  let status;
  try {
    status = await getEarnStatus(user.id, locale);
  } catch {
    return (
      <>
        <DashboardHeader
          title="Kazanç merkezi"
          description="Faiz · kira · iş · çark · görevler"
        />
        <main className="mx-auto max-w-3xl page-pad py-6 md:py-8">
          <div className="rounded-[1.35rem] border border-destructive/30 bg-destructive/5 px-5 py-8 text-sm">
            <p className="font-semibold text-destructive">
              Kazanç sistemi henüz aktif değil
            </p>
            <p className="mt-2 text-muted-foreground">
              Supabase SQL Editor&apos;de{" "}
              <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">
                phase-18-income-market.sql
              </code>{" "}
              dosyasını bir kez çalıştır.
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <DashboardHeader
        title="Kazanç merkezi"
        description="Faiz · kira · yan iş · şans çarkı · günlük görevler"
      />
      <main className="mx-auto max-w-3xl page-pad py-6 md:py-8">
        <EarnHub status={status} />
      </main>
    </>
  );
}
