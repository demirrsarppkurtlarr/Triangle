"use client";

import { motion, useReducedMotion } from "framer-motion";

import { softSpring, snappySpring } from "@/lib/motion";
import { cn } from "@/lib/utils";

type MotionPressableProps = {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "span";
};

/** Apple-style press / hover spring wrapper */
export function MotionPressable({
  children,
  className,
  as = "div",
}: MotionPressableProps) {
  const reduce = useReducedMotion();
  const Comp = as === "span" ? motion.span : motion.div;

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <Comp
      className={cn("inline-flex w-full origin-center", className)}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.97 }}
      transition={snappySpring}
    >
      {children}
    </Comp>
  );
}

type MotionCardProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

export function MotionCard({ children, className, delay = 0 }: MotionCardProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0.92, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -4, transition: softSpring }}
      transition={{ ...softSpring, delay }}
    >
      {children}
    </motion.div>
  );
}
