import { AdminEconomyPanel } from "@/features/admin/components/admin-economy-panel";
import {
  getAdminGameItems,
  getEconomySettings,
} from "@/features/admin/services/economy.service";

export default async function AdminEconomyPage() {
  const [settings, items] = await Promise.all([
    getEconomySettings(),
    getAdminGameItems(),
  ]);

  return <AdminEconomyPanel settings={settings} items={items} />;
}
