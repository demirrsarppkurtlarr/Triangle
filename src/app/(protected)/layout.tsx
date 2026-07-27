import { redirect } from "next/navigation";

import { RealtimeShell } from "@/components/layout/realtime-shell";
import { getDashboardData } from "@/features/dashboard/services/dashboard.service";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_USERNAME } from "@/utils/constants";

type ProtectedLayoutProps = {
  children: React.ReactNode;
};

export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const dashboard = await getDashboardData(user.id);
  const unreadCount = dashboard?.unreadCount ?? 0;
  const isAdmin = Boolean(
    dashboard?.profile.username === ADMIN_USERNAME &&
      dashboard?.profile.is_admin &&
      !dashboard?.profile.is_frozen,
  );

  return (
    <RealtimeShell
      key={user.id}
      userId={user.id}
      initialUnread={unreadCount}
      isAdmin={isAdmin}
    >
      {children}
    </RealtimeShell>
  );
}
