"use client";

import { motion, useReducedMotion } from "framer-motion";

import { softSpring } from "@/lib/motion";
import { cn } from "@/lib/utils";

type MotionProgressProps = {
  value: number;
  className?: string;
  barClassName?: string;
};

/** Width animates from 0 → value% */
export function MotionProgress({
  value,
  className,
  barClassName,
}: MotionProgressProps) {
  const reduce = useReducedMotion();
  const width = `${Math.min(100, Math.max(0, value))}%`;

  return (
    <div className={cn("overflow-hidden", className)}>
      {reduce ? (
        <div className={cn("h-full", barClassName)} style={{ width }} />
      ) : (
        <motion.div
          className={cn("h-full origin-left", barClassName)}
          initial={{ width: 0 }}
          animate={{ width }}
          transition={softSpring}
        />
      )}
    </div>
  );
}
