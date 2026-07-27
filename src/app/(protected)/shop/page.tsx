import { redirect } from "next/navigation";
import Link from "next/link";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { ShopCatalog } from "@/features/game/components/shop-catalog";
import {
  getCashBalance,
  getShopCatalog,
} from "@/features/game/services/game.service";
import { createClient } from "@/lib/supabase/server";

export default async function ShopPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [items, cash] = await Promise.all([
    getShopCatalog(),
    getCashBalance(user.id),
  ]);

  return (
    <>
      <DashboardHeader
        title="Shop"
        description="Cars, homes, gadgets — spend your game cash"
      />
      <main className="mx-auto max-w-6xl space-y-6 page-pad py-6 md:py-8">
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/inventory"
            className="rounded-2xl bg-secondary/80 px-3.5 py-2 font-medium text-muted-foreground hover:text-foreground"
          >
            Inventory
          </Link>
          <Link
            href="/marketplace"
            className="rounded-2xl bg-secondary/80 px-3.5 py-2 font-medium text-muted-foreground hover:text-foreground"
          >
            Player marketplace
          </Link>
        </div>
        <ShopCatalog items={items} cash={cash} />
      </main>
    </>
  );
}
