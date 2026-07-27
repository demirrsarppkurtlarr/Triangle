import { redirect } from "next/navigation";
import Link from "next/link";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { getDashboardData } from "@/features/dashboard/services/dashboard.service";
import { GameItemIcon, RarityBadge } from "@/features/game/components/game-item-meta";
import { getUserInventory } from "@/features/game/services/game.service";
import { getUserPreferences } from "@/features/settings/services/settings.service";
import { TriangleIdCard } from "@/features/triangle-id/components/triangle-id-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getRequestDictionary } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { t } = await getRequestDictionary();
  const [data, preferences, inventory] = await Promise.all([
    getDashboardData(user.id),
    getUserPreferences(user.id),
    getUserInventory(user.id),
  ]);
  if (!data) redirect("/login");

  const byId = new Map(inventory.map((row) => [row.itemId, row.item]));
  const showcase = [
    {
      label: t.inventory.garage,
      item: preferences.showcaseVehicleId
        ? byId.get(preferences.showcaseVehicleId)
        : null,
    },
    {
      label: t.inventory.home,
      item: preferences.showcasePropertyId
        ? byId.get(preferences.showcasePropertyId)
        : null,
    },
    {
      label: t.inventory.desk,
      item: preferences.showcaseGadgetId
        ? byId.get(preferences.showcaseGadgetId)
        : null,
    },
    {
      label: t.inventory.display,
      item: preferences.showcaseCollectibleId
        ? byId.get(preferences.showcaseCollectibleId)
        : null,
    },
  ];

  return (
    <>
      <DashboardHeader
        title={data.profile.full_name || data.profile.username}
        description="TriangleBank"
        username={data.profile.username}
      />

      <main className="mx-auto max-w-3xl space-y-6 page-pad py-6 md:py-8">
        <TriangleIdCard
          triangleId={data.profile.triangle_id}
          username={data.profile.username}
        />

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>{t.inventory.showcase}</CardTitle>
            <CardDescription>{t.inventory.showcaseHint}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {showcase.map((slot) => (
              <div
                key={slot.label}
                className="rounded-2xl border border-border/50 bg-secondary/40 p-3"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {slot.label}
                </p>
                {slot.item ? (
                  <div className="mt-2 flex items-center gap-2">
                    <GameItemIcon icon={slot.item.icon} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {slot.item.name}
                      </p>
                      <RarityBadge rarity={slot.item.rarity} />
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    <Link href="/inventory" className="underline-offset-2 hover:underline">
                      {t.nav.inventory}
                    </Link>
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Account details</CardTitle>
            <CardDescription>{t.common.virtualOnly}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between gap-4 border-b border-border/50 pb-3">
              <span className="text-muted-foreground">Email</span>
              <span className="break-all font-medium">{data.profile.email}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-border/50 pb-3">
              <span className="text-muted-foreground">Account number</span>
              <span className="font-mono font-medium">
                {data.account.account_number}
              </span>
            </div>
            <div className="flex justify-between gap-4 border-b border-border/50 pb-3">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium capitalize">
                {data.profile.is_frozen ? "Frozen" : data.account.status}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium">
                {data.profile.is_admin ? "Administrator" : "Member"}
              </span>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
