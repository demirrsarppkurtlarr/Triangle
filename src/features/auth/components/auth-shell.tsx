"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
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
      <motion.div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.12),_transparent_50%)]"
        aria-hidden="true"
        initial={reduce ? false : { opacity: 0, scale: 1.08 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />

      <div className="relative z-10 w-full max-w-md">
        <Stagger className="mb-8 flex flex-col items-center text-center">
          <StaggerItem>
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
          </StaggerItem>
          <StaggerItem>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          </StaggerItem>
          <StaggerItem>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </StaggerItem>
        </Stagger>

        <motion.div
          className="glass-panel rounded-3xl border border-border/50 p-6 shadow-soft"
          initial={reduce ? false : { opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...softSpring, delay: 0.12 }}
        >
          {children}
        </motion.div>

        {footer && (
          <motion.div
            className="mt-6 text-center text-sm text-muted-foreground"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.28, duration: 0.4 }}
          >
            {footer}
          </motion.div>
        )}
      </div>
    </div>
  );
}
