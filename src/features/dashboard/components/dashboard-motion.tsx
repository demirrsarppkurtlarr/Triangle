"use client";

import { FadeIn } from "@/components/motion/fade-in";
import { Stagger, StaggerItem } from "@/components/motion/stagger";

type DashboardMotionProps = {
  hero: React.ReactNode;
  actions: React.ReactNode;
  primary: React.ReactNode;
  secondary: React.ReactNode;
  extras?: React.ReactNode;
};

export function DashboardMotion({
  hero,
  actions,
  primary,
  secondary,
  extras,
}: DashboardMotionProps) {
  return (
    <div className="space-y-8">
      <FadeIn variant="scale">{hero}</FadeIn>
      <FadeIn delay={0.08}>{actions}</FadeIn>
      <Stagger className="grid gap-8 lg:grid-cols-5">
        <StaggerItem className="lg:col-span-3">{primary}</StaggerItem>
        <StaggerItem className="lg:col-span-2">{secondary}</StaggerItem>
      </Stagger>
      {extras && <FadeIn delay={0.16}>{extras}</FadeIn>}
    </div>
  );
}
