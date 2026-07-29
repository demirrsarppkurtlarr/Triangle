"use client";

import { AppNav } from "@/components/layout/app-nav";
import { RouteWarmup } from "@/components/layout/route-warmup";
import { PageEnter } from "@/components/motion/page-enter";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";

type RealtimeShellProps = {
  userId: string;
  initialUnread: number;
  isAdmin: boolean;
  children: React.ReactNode;
};

const APP_ROUTES = [
  "/dashboard",
  "/rewards",
  "/earn",
  "/battle-pass",
  "/transfer",
  "/stocks",
  "/crypto",
  "/forex",
  "/predictions",
  "/loans",
  "/deposits",
  "/insurance",
  "/news",
  "/leaderboard",
  "/portfolio",
  "/notifications",
  "/profile",
  "/transactions",
  "/settings",
  "/shop",
  "/inventory",
  "/marketplace",
  "/chat",
  "/themes",
  "/admin",
];

export function RealtimeShell({
  userId,
  initialUnread,
  isAdmin,
  children,
}: RealtimeShellProps) {
  const { unreadCount } = useRealtimeNotifications(userId, initialUnread);

  return (
    <div className="flex min-h-dvh bg-background">
      <RouteWarmup
        routes={isAdmin ? APP_ROUTES : APP_ROUTES.filter((r) => r !== "/admin")}
      />
      <AppNav unreadCount={unreadCount} isAdmin={isAdmin} variant="sidebar" />
      <div className="flex min-h-dvh min-w-0 flex-1 flex-col safe-bottom md:pb-0">
        <PageEnter>{children}</PageEnter>
      </div>
      <AppNav unreadCount={unreadCount} isAdmin={isAdmin} variant="mobile" />
    </div>
  );
}
