"use client";

import { useActionState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import {
  signUpAction,
  type AuthActionState,
} from "@/features/auth/actions/auth.actions";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { softSpring } from "@/lib/motion";

const initialState: AuthActionState = {};

export function RegisterForm() {
  const reduce = useReducedMotion();
  const [state, formAction, isPending] = useActionState(
    signUpAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Stagger className="flex flex-col gap-4" fast>
        <StaggerItem>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="yourname"
              autoComplete="username"
              required
            />
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name (optional)</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="John Doe"
              autoComplete="name"
            />
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </div>
        </StaggerItem>
      </Stagger>

      <AnimatePresence mode="wait">
        {state.error && (
          <motion.p
            key={state.error}
            initial={reduce ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={softSpring}
            className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {state.error}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.div whileTap={reduce ? undefined : { scale: 0.98 }}>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Creating account..." : "Create account"}
        </Button>
      </motion.div>

      <p className="text-center text-xs text-muted-foreground">
        By creating an account, you agree that TriangleBank is a virtual
        simulation using no real money.
      </p>
    </form>
  );
}
