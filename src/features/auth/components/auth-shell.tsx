"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { RouteWarmup } from "@/components/layout/route-warmup";
import { TriangleLogo } from "@/components/brand/triangle-logo";
import { softSpring } from "@/lib/motion";
import { APP_NAME } from "@/utils/constants";

type AuthShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthShell({
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  const reduce = useReducedMotion();

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background page-pad py-10 md:py-12">
      <RouteWarmup routes={["/", "/login", "/register", "/dashboard"]} />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.12),_transparent_50%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md animate-[fade-rise_0.45s_cubic-bezier(0.22,1,0.36,1)_both]">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" className="mb-4 flex items-center gap-3">
            <motion.span
              whileHover={reduce ? undefined : { scale: 1.04, rotate: -2 }}
              transition={softSpring}
            >
              <TriangleLogo size={40} showGlow />
            </motion.span>
            <span className="text-lg font-semibold tracking-tight">
              {APP_NAME}
            </span>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="glass-panel rounded-3xl border border-border/50 p-6 shadow-soft">
          {children}
        </div>

        {footer && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
