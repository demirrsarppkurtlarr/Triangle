import { redirect } from "next/navigation";
import Link from "next/link";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { InventoryList } from "@/features/game/components/inventory-list";
import { getUserInventory } from "@/features/game/services/game.service";
import { createClient } from "@/lib/supabase/server";

export default async function InventoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const rows = await getUserInventory(user.id);

  return (
    <>
      <DashboardHeader
        title="Inventory"
        description="Sell back to the shop or list on the player market"
      />
      <main className="mx-auto max-w-6xl space-y-6 page-pad py-6 md:py-8">
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/shop"
            className="rounded-2xl bg-secondary/80 px-3.5 py-2 font-medium text-muted-foreground hover:text-foreground"
          >
            Shop
          </Link>
          <Link
            href="/marketplace"
            className="rounded-2xl bg-secondary/80 px-3.5 py-2 font-medium text-muted-foreground hover:text-foreground"
          >
            Marketplace
          </Link>
        </div>
        <InventoryList rows={rows} />
      </main>
    </>
  );
}
