"use client";

import { motion, useReducedMotion } from "framer-motion";

import { listItem, staggerContainer, staggerFast } from "@/lib/motion";
import { cn } from "@/lib/utils";

type StaggerProps = {
  children: React.ReactNode;
  className?: string;
  fast?: boolean;
  as?: "div" | "ul";
};

export function Stagger({
  children,
  className,
  fast = false,
  as = "div",
}: StaggerProps) {
  const reduce = useReducedMotion();
  const Component = as === "ul" ? motion.ul : motion.div;

  if (reduce) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Component
      className={cn(className)}
      variants={fast ? staggerFast : staggerContainer}
      initial="hidden"
      animate="show"
    >
      {children}
    </Component>
  );
}

type StaggerItemProps = {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li";
};

export function StaggerItem({
  children,
  className,
  as = "div",
}: StaggerItemProps) {
  const reduce = useReducedMotion();
  const Component = as === "li" ? motion.li : motion.div;

  if (reduce) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Component className={cn(className)} variants={listItem}>
      {children}
    </Component>
  );
}
