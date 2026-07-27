"use client";

import Link from "next/link";
import { ArrowRight, Shield, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { FadeIn } from "@/components/motion/fade-in";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { TriangleLogo } from "@/components/brand/triangle-logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { softSpring } from "@/lib/motion";
import { APP_DESCRIPTION, APP_NAME } from "@/utils/constants";

const features = [
  {
    icon: Wallet,
    title: "Virtual Banking",
    description:
      "Send, receive, and manage simulated balances with bank-grade UX — no real money involved.",
  },
  {
    icon: TrendingUp,
    title: "Stock Market",
    description:
      "Practice investing in US equities with portfolios, charts, and real-time market simulation.",
  },
  {
    icon: Shield,
    title: "Secure by Design",
    description:
      "Row-level security, server-side transactions, and audit trails protect every virtual operation.",
  },
];

export function LandingPage() {
  const reduce = useReducedMotion();

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.12),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(6,182,212,0.1),_transparent_45%)]"
        aria-hidden="true"
      />

      <header className="page-pad relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between py-5 md:py-6">
        <motion.div
          className="flex min-w-0 items-center gap-2.5 sm:gap-3"
          initial={reduce ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={softSpring}
        >
          <TriangleLogo size={32} showGlow />
          <span className="truncate text-base font-semibold tracking-tight sm:text-lg">
            {APP_NAME}
          </span>
        </motion.div>
        <motion.div
          className="flex shrink-0 items-center gap-1.5 sm:gap-3"
          initial={reduce ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...softSpring, delay: 0.05 }}
        >
          <Button variant="ghost" size="sm" className="px-2.5 sm:px-4" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button size="sm" className="sm:h-11 sm:px-6 sm:text-base" asChild>
            <Link href="/register">Get started</Link>
          </Button>
        </motion.div>
      </header>

      <main className="page-pad relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-14 pb-20 pt-8 md:gap-20 md:pt-16">
        <section className="flex flex-col items-center gap-6 text-center md:gap-8">
          <FadeIn>
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs text-muted-foreground shadow-soft backdrop-blur-md sm:px-4 sm:py-2 sm:text-sm">
              <Sparkles className="size-3.5 shrink-0 text-accent sm:size-4" />
              <span className="truncate">Educational · Virtual money only</span>
            </div>
          </FadeIn>

          <FadeIn delay={0.06}>
            <div className="max-w-3xl space-y-4 md:space-y-6">
              <h1 className="text-balance text-[2rem] font-semibold leading-tight tracking-tight text-foreground sm:text-4xl md:text-6xl md:leading-[1.08]">
                Banking reimagined for learning.
              </h1>
              <p className="text-balance text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl">
                {APP_DESCRIPTION} Experience transfers, portfolios, and premium
                design — crafted with Apple-level attention to detail.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.12}>
            <div className="flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
              <Button size="lg" className="w-full sm:w-auto" asChild>
                <Link href="/register">
                  Open your account
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto"
                asChild
              >
                <Link href="/login">Sign in to TriangleBank</Link>
              </Button>
            </div>
          </FadeIn>
        </section>

        <Stagger className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <Card className="glass-panel h-full border-border/50 transition-transform hover:-translate-y-1">
                <CardHeader>
                  <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <feature.icon className="size-5" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>

        <FadeIn variant="scale">
          <Card className="glass-panel overflow-hidden border-border/50">
            <CardContent className="flex flex-col items-start justify-between gap-6 p-8 md:flex-row md:items-center">
              <div className="space-y-2">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Triangle ID
                </p>
                <p className="font-mono text-2xl font-semibold tracking-wide text-foreground md:text-3xl">
                  TR-4938-2910-9918
                </p>
                <p className="max-w-xl text-sm text-muted-foreground">
                  Every member receives a unique Triangle ID for seamless
                  transfers across the platform.
                </p>
              </div>
              <Button variant="secondary" asChild>
                <Link href="/register">Create your Triangle ID</Link>
              </Button>
            </CardContent>
          </Card>
        </FadeIn>
      </main>

      <footer className="relative z-10 border-t border-border/60 bg-card/40 backdrop-blur-md">
        <div className="page-pad mx-auto flex w-full max-w-6xl flex-col gap-2 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. Simulation only.
          </p>
          <p>No real money transfers. For educational purposes.</p>
        </div>
      </footer>
    </div>
  );
}
