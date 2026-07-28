import { AdminEconomyPanel } from "@/features/admin/components/admin-economy-panel";
import {
  getAdminGameItems,
  getEconomySettings,
} from "@/features/admin/services/economy.service";

export default async function AdminEconomyPage() {
  try {
    const [settings, items] = await Promise.all([
      getEconomySettings(),
      getAdminGameItems(),
    ]);
    return <AdminEconomyPanel settings={settings} items={items} />;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Economy tools unavailable";
    return (
      <div className="rounded-[1.35rem] border border-destructive/30 bg-destructive/5 px-5 py-8 text-sm">
        <p className="font-semibold text-destructive">Economy panel error</p>
        <p className="mt-2 text-muted-foreground">{message}</p>
        <p className="mt-3 text-muted-foreground">
          Run{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">
            phase-17-engagement.sql
          </code>{" "}
          in Supabase SQL Editor, then reload.
        </p>
      </div>
    );
  }
}
