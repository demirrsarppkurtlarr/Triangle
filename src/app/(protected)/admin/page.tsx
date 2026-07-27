import { AdminOverview } from "@/features/admin/components/admin-overview";
import { getAdminStats } from "@/features/admin/services/admin.service";
import { formatCurrency } from "@/utils/format";

export default async function AdminOverviewPage() {
  const stats = await getAdminStats();

  return <AdminOverview stats={stats} formatCurrency={formatCurrency} />;
}
