"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { softSpring } from "@/lib/motion";
import { cn } from "@/lib/utils";

type ActionFeedbackProps = {
  error?: string;
  success?: string;
  className?: string;
};

export function ActionFeedback({
  error,
  success,
  className,
}: ActionFeedbackProps) {
  const reduce = useReducedMotion();
  const message = error || success;
  const tone = error ? "error" : "success";

  return (
    <AnimatePresence mode="wait">
      {message && (
        <motion.p
          key={`${tone}-${message}`}
          initial={reduce ? false : { opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={softSpring}
          className={cn(
            "rounded-2xl px-4 py-3 text-sm",
            tone === "error"
              ? "bg-destructive/10 text-destructive"
              : "bg-success/10 text-success",
            className,
          )}
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
