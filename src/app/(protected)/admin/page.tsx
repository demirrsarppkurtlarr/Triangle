import { AdminOverview } from "@/features/admin/components/admin-overview";
import { getAdminStats } from "@/features/admin/services/admin.service";

export default async function AdminOverviewPage() {
  const stats = await getAdminStats();
  return <AdminOverview stats={stats} />;
}
