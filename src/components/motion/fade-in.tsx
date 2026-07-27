"use client";

import { motion, useReducedMotion } from "framer-motion";

import { fadeIn, fadeUp, scaleIn } from "@/lib/motion";
import { cn } from "@/lib/utils";

type FadeInProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "up" | "in" | "scale";
  delay?: number;
};

export function FadeIn({
  children,
  className,
  variant = "up",
  delay = 0,
}: FadeInProps) {
  const reduce = useReducedMotion();
  const variants =
    variant === "in" ? fadeIn : variant === "scale" ? scaleIn : fadeUp;

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      variants={variants}
      initial="hidden"
      animate="show"
      transition={delay > 0 ? { delay } : undefined}
    >
      {children}
    </motion.div>
  );
}
