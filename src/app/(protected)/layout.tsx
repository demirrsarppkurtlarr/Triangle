import { redirect } from "next/navigation";

import { RealtimeShell } from "@/components/layout/realtime-shell";
import { getShellNavData } from "@/features/dashboard/services/shell.service";
import { createClient } from "@/lib/supabase/server";

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

  const shell = await getShellNavData(user.id);

  return (
    <RealtimeShell
      key={user.id}
      userId={user.id}
      initialUnread={shell?.unreadCount ?? 0}
      isAdmin={shell?.isAdmin ?? false}
    >
      {children}
    </RealtimeShell>
  );
}
