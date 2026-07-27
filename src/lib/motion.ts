import type { Transition, Variants } from "framer-motion";

/** Apple-like soft spring */
export const softSpring: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 28,
  mass: 0.85,
};

export const gentleSpring: Transition = {
  type: "spring",
  stiffness: 220,
  damping: 26,
  mass: 1,
};

export const snappySpring: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 30,
  mass: 0.7,
};

/** Apple ease curve */
export const appleEase = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0.92, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: softSpring,
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.45, ease: appleEase },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 12 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: softSpring,
  },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: gentleSpring,
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.06,
    },
  },
};

export const staggerFast: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.03,
    },
  },
};

export const listItem: Variants = {
  hidden: { opacity: 0.9, y: 12, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: softSpring,
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.98,
    transition: { duration: 0.2, ease: appleEase },
  },
};

export const pageEnter: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { ...gentleSpring, delay: 0.02 },
  },
};
