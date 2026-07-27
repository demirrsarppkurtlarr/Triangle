"use client";

import { AppNav } from "@/components/layout/app-nav";
import { PageEnter } from "@/components/motion/page-enter";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";

type RealtimeShellProps = {
  userId: string;
  initialUnread: number;
  isAdmin: boolean;
  children: React.ReactNode;
};

export function RealtimeShell({
  userId,
  initialUnread,
  isAdmin,
  children,
}: RealtimeShellProps) {
  const { unreadCount } = useRealtimeNotifications(userId, initialUnread);

  return (
    <div className="flex min-h-dvh bg-background">
      <AppNav unreadCount={unreadCount} isAdmin={isAdmin} variant="sidebar" />
      <div className="flex min-h-dvh min-w-0 flex-1 flex-col safe-bottom md:pb-0">
        <PageEnter>{children}</PageEnter>
      </div>
      <AppNav unreadCount={unreadCount} isAdmin={isAdmin} variant="mobile" />
    </div>
  );
}
