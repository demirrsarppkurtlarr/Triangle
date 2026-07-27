"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

import { pageEnter } from "@/lib/motion";
import { cn } from "@/lib/utils";

type PageEnterProps = {
  children: React.ReactNode;
  className?: string;
};

/** Soft Apple-style enter on route change */
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
      variants={pageEnter}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  );
}
