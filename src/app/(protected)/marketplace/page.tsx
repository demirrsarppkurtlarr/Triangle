import { redirect } from "next/navigation";
import Link from "next/link";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { MarketplaceList } from "@/features/game/components/marketplace-list";
import { getMarketplaceListings } from "@/features/game/services/game.service";
import { createClient } from "@/lib/supabase/server";

export default async function MarketplacePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const listings = await getMarketplaceListings(user.id);

  return (
    <>
      <DashboardHeader
        title="Marketplace"
        description="Buy and sell items with other players"
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
            href="/inventory"
            className="rounded-2xl bg-secondary/80 px-3.5 py-2 font-medium text-muted-foreground hover:text-foreground"
          >
            Inventory
          </Link>
        </div>
        <MarketplaceList listings={listings} />
      </main>
    </>
  );
}
