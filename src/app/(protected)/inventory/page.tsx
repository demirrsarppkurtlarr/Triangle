import { redirect } from "next/navigation";
import Link from "next/link";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { InventoryList } from "@/features/game/components/inventory-list";
import { getUserInventory } from "@/features/game/services/game.service";
import { getUserPreferences } from "@/features/settings/services/settings.service";
import { getRequestDictionary } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export default async function InventoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { t } = await getRequestDictionary();
  const [rows, preferences] = await Promise.all([
    getUserInventory(user.id),
    getUserPreferences(user.id),
  ]);

  return (
    <>
      <DashboardHeader
        title={t.inventory.title}
        description={t.inventory.description}
      />
      <main className="mx-auto max-w-6xl space-y-6 page-pad py-6 md:py-8">
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/shop"
            className="min-h-10 rounded-2xl bg-secondary/80 px-3.5 py-2 font-medium text-muted-foreground hover:text-foreground"
          >
            {t.nav.shop}
          </Link>
          <Link
            href="/marketplace"
            className="min-h-10 rounded-2xl bg-secondary/80 px-3.5 py-2 font-medium text-muted-foreground hover:text-foreground"
          >
            {t.nav.marketplace}
          </Link>
        </div>
        <InventoryList rows={rows} preferences={preferences} />
      </main>
    </>
  );
}
