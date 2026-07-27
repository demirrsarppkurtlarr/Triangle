"use client";

import { signOutAction } from "@/features/auth/actions/auth.actions";
import { MotionButton } from "@/components/motion/motion-button";
import { useI18n } from "@/lib/i18n/client";
import { motion, useReducedMotion } from "framer-motion";
import { softSpring } from "@/lib/motion";

type DashboardHeaderProps = {
  title: string;
  description?: string;
  username?: string;
};

export function DashboardHeader({
  title,
  description,
  username,
}: DashboardHeaderProps) {
  const reduce = useReducedMotion();
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-card/70 backdrop-blur-xl supports-[backdrop-filter]:bg-card/50">
      <div className="page-pad mx-auto flex max-w-6xl items-start justify-between gap-3 py-4 md:items-center md:py-5">
        <motion.div
          className="min-w-0 flex-1"
          initial={reduce ? false : { opacity: 0.94, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={softSpring}
        >
          <h1 className="truncate text-xl font-semibold tracking-tight md:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground md:line-clamp-none">
              {description}
            </p>
          )}
          {username && (
            <p className="mt-1 text-xs text-muted-foreground">@{username}</p>
          )}
        </motion.div>
        <form action={signOutAction} className="hidden shrink-0 md:block">
          <MotionButton variant="outline" size="sm" type="submit">
            {t.common.signOut}
          </MotionButton>
        </form>
      </div>
    </header>
  );
}
