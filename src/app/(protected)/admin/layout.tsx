import { AdminNav } from "@/features/admin/components/admin-nav";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { requireAdmin } from "@/features/admin/services/admin-auth.service";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  await requireAdmin();

  return (
    <>
      <DashboardHeader
        title="Admin"
        description="Server-enforced controls · demirsarpk only"
      />
      <div className="mx-auto max-w-6xl space-y-6 page-pad py-5 md:py-6">
        <AdminNav />
        {children}
      </div>
    </>
  );
}
