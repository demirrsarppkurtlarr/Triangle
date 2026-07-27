"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  ArrowLeftRight,
  LayoutDashboard,
  ScrollText,
  Settings2,
  Users,
  Wallet,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { useI18n } from "@/lib/i18n/client";
import { softSpring } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const reduce = useReducedMotion();
  const { t } = useI18n();

  const adminNav = [
    { href: "/admin", label: t.admin.overview, icon: LayoutDashboard },
    { href: "/admin/users", label: t.admin.users, icon: Users },
    { href: "/admin/transfers", label: t.admin.transfers, icon: ArrowLeftRight },
    { href: "/admin/limits", label: t.admin.limits, icon: Settings2 },
    { href: "/admin/economy", label: t.admin.economy, icon: Wallet },
    { href: "/admin/logs", label: t.admin.logs, icon: ScrollText },
  ];

  return (
    <div className="relative">
      {isPending && (
        <div className="absolute inset-x-0 -top-1 h-0.5 overflow-hidden rounded-full">
          <div className="h-full w-1/3 animate-[nav-progress_0.9s_ease-in-out_infinite] rounded-full bg-primary" />
        </div>
      )}
      <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {adminNav.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              onClick={(e) => {
                e.preventDefault();
                startTransition(() => router.push(item.href));
              }}
              className={cn(
                "relative inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-colors sm:px-4",
                active
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active && !reduce && (
                <motion.span
                  layoutId="admin-nav-pill"
                  className="absolute inset-0 -z-10 rounded-2xl bg-primary shadow-soft"
                  transition={softSpring}
                />
              )}
              {active && reduce && (
                <span className="absolute inset-0 -z-10 rounded-2xl bg-primary shadow-soft" />
              )}
              {!active && (
                <span className="absolute inset-0 -z-10 rounded-2xl bg-secondary/70 transition-colors group-hover:bg-secondary" />
              )}
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
