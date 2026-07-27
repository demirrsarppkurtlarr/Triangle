import { redirect } from "next/navigation";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { NotificationsCenter } from "@/features/notifications/components/notifications-center";
import { createClient } from "@/lib/supabase/server";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, title, body, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const items = notifications ?? [];

  return (
    <>
      <DashboardHeader
        title="Notifications"
        description="Live alerts · transfers, stocks, and account updates"
      />
      <main className="relative mx-auto max-w-2xl space-y-6 page-pad py-6 md:py-8">
        <div
          className="pointer-events-none absolute inset-x-0 -top-8 h-48 bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.08),_transparent_60%)]"
          aria-hidden="true"
        />
        <div className="relative z-10">
          <NotificationsCenter
            key={user.id}
            userId={user.id}
            initialItems={items}
          />
        </div>
      </main>
    </>
  );
}
