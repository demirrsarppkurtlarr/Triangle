"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

import { softSpring } from "@/lib/motion";
import { cn } from "@/lib/utils";

type PageEnterProps = {
  children: React.ReactNode;
  className?: string;
};

/** Soft enter — never hides content (avoids blank flashes). */
export function PageEnter({ children, className }: PageEnterProps) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      key={pathname}
      className={cn("min-w-0 flex-1", className)}
      initial={{ opacity: 0.96, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={softSpring}
    >
      {children}
    </motion.div>
  );
}
