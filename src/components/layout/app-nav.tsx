"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  ArrowLeftRight,
  Bell,
  Briefcase,
  Home,
  Shield,
  TrendingUp,
  User,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { TriangleLogo } from "@/components/brand/triangle-logo";
import { softSpring } from "@/lib/motion";
import { cn } from "@/lib/utils";

const baseNavItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/transfer", label: "Send", icon: ArrowLeftRight },
  { href: "/stocks", label: "Market", icon: TrendingUp },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/profile", label: "Profile", icon: User },
];

type AppNavProps = {
  unreadCount?: number;
  isAdmin?: boolean;
  variant?: "sidebar" | "mobile";
};

export function AppNav({
  unreadCount = 0,
  isAdmin = false,
  variant = "sidebar",
}: AppNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const reduce = useReducedMotion();
  const navItems = [
    ...baseNavItems.slice(0, 4),
    ...(isAdmin
      ? [{ href: "/admin", label: "Admin", icon: Shield }]
      : []),
    ...baseNavItems.slice(4),
  ];

  const mobileItems = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/transfer", label: "Send", icon: ArrowLeftRight },
    { href: "/stocks", label: "Market", icon: TrendingUp },
    { href: "/portfolio", label: "Holdings", icon: Briefcase },
    {
      href: unreadCount > 0 ? "/notifications" : "/profile",
      label: unreadCount > 0 ? "Alerts" : "You",
      icon: unreadCount > 0 ? Bell : User,
    },
  ];

  function navigate(href: string) {
    startTransition(() => {
      router.push(href);
    });
  }

  if (variant === "mobile") {
    return (
      <nav
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card/95 backdrop-blur-xl md:hidden",
          isPending && "opacity-90",
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {isPending && (
          <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden">
            <div className="h-full w-1/3 animate-[nav-progress_0.9s_ease-in-out_infinite] rounded-full bg-primary" />
          </div>
        )}
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1.5">
          {mobileItems.map((item) => {
            const active =
              item.href === "/stocks"
                ? pathname.startsWith("/stocks")
                : item.href === "/portfolio"
                  ? pathname.startsWith("/portfolio")
                  : pathname === item.href ||
                    (item.href === "/notifications" &&
                      pathname.startsWith("/notifications"));
            const showBadge =
              item.href === "/notifications" && unreadCount > 0;
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                prefetch
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.href);
                }}
                className={cn(
                  "relative flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-2 text-[10px] font-medium transition-colors active:scale-[0.97] sm:text-[11px]",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active && !reduce && (
                  <motion.span
                    layoutId="mobile-nav-glow"
                    className="absolute inset-x-2 top-1 -z-10 h-8 rounded-2xl bg-primary/10"
                    transition={softSpring}
                  />
                )}
                <motion.span
                  animate={reduce ? undefined : { scale: active ? 1.08 : 1 }}
                  transition={softSpring}
                >
                  <item.icon
                    className="size-5"
                    strokeWidth={active ? 2.25 : 2}
                  />
                </motion.span>
                <span className="truncate">{item.label}</span>
                {showBadge && (
                  <span className="absolute right-1.5 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-card/40 backdrop-blur-2xl md:flex md:flex-col">
      <div className="flex items-center gap-3 px-6 py-7">
        <TriangleLogo size={34} showGlow />
        <div>
          <p className="font-semibold tracking-tight">TriangleBank</p>
          <p className="text-xs text-muted-foreground">Virtual wealth</p>
        </div>
      </div>

      {isPending && (
        <div className="mx-3 mb-2 h-0.5 overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-1/3 animate-[nav-progress_0.9s_ease-in-out_infinite] rounded-full bg-primary" />
        </div>
      )}

      <nav className="relative flex flex-1 flex-col gap-1 px-3">
        {navItems.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname.startsWith("/admin")
              : item.href === "/stocks"
                ? pathname.startsWith("/stocks")
                : item.href === "/portfolio"
                  ? pathname.startsWith("/portfolio")
                  : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              onClick={(e) => {
                e.preventDefault();
                navigate(item.href);
              }}
              className={cn(
                "relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                active
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
              )}
            >
              {active && !reduce && (
                <motion.span
                  layoutId="sidebar-nav-pill"
                  className="absolute inset-0 -z-10 rounded-2xl bg-primary shadow-soft"
                  transition={softSpring}
                />
              )}
              {active && reduce && (
                <span className="absolute inset-0 -z-10 rounded-2xl bg-primary shadow-soft" />
              )}
              <item.icon className="size-4" />
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pb-6">
        <Link
          href="/notifications"
          prefetch
          onClick={(e) => {
            e.preventDefault();
            navigate("/notifications");
          }}
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
        >
          <Bell className="size-4" />
          <span className="flex-1">Notifications</span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {unreadCount}
            </span>
          )}
        </Link>
      </div>
    </aside>
  );
}
