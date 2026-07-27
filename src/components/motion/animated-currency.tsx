"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";

import { formatCurrency } from "@/utils/format";

type AnimatedCurrencyProps = {
  value: number;
  currency?: string;
  className?: string;
};

export function AnimatedCurrency({
  value,
  currency = "USD",
  className,
}: AnimatedCurrencyProps) {
  const reduce = useReducedMotion();
  const motionValue = useMotionValue(value);
  const spring = useSpring(motionValue, {
    stiffness: 120,
    damping: 24,
    mass: 0.8,
  });
  const display = useTransform(spring, (latest) =>
    formatCurrency(latest, currency),
  );
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    motionValue.set(value);
  }, [motionValue, value]);

  useEffect(() => {
    if (reduce) return;
    const unsubscribe = display.on("change", (v) => {
      if (textRef.current) textRef.current.textContent = v;
    });
    return unsubscribe;
  }, [display, reduce]);

  if (reduce) {
    return <span className={className}>{formatCurrency(value, currency)}</span>;
  }

  return (
    <motion.span
      ref={textRef}
      className={className}
      initial={false}
      animate={{ scale: 1 }}
    >
      {formatCurrency(value, currency)}
    </motion.span>
  );
}
