"use client";

import { Loader2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { Button, type ButtonProps } from "@/components/ui/button";
import { snappySpring } from "@/lib/motion";
import { cn } from "@/lib/utils";

type MotionButtonProps = ButtonProps & {
  pending?: boolean;
  pendingLabel?: string;
};

export function MotionButton({
  children,
  pending,
  pendingLabel,
  disabled,
  className,
  ...props
}: MotionButtonProps) {
  const reduce = useReducedMotion();

  const button = (
    <Button
      disabled={disabled || pending}
      className={cn(
        pending && "relative overflow-hidden",
        className,
      )}
      {...props}
    >
      {pending && (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      )}
      {pending ? pendingLabel || children : children}
    </Button>
  );

  if (reduce) return button;

  return (
    <motion.div
      className={cn(
        "inline-flex",
        (className ?? "").includes("w-full") && "w-full",
      )}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={snappySpring}
    >
      {button}
    </motion.div>
  );
}
