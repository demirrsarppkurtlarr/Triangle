"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import {
  signInAction,
  type AuthActionState,
} from "@/features/auth/actions/auth.actions";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { softSpring } from "@/lib/motion";

const initialState: AuthActionState = {};

type LoginFormProps = {
  redirect?: string;
};

export function LoginForm({ redirect }: LoginFormProps) {
  const reduce = useReducedMotion();
  const [state, formAction, isPending] = useActionState(
    signInAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {redirect && <input type="hidden" name="redirect" value={redirect} />}

      <Stagger className="flex flex-col gap-4" fast>
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary transition-opacity hover:opacity-80"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
        </StaggerItem>
      </Stagger>

      <AnimatePresence mode="wait">
        {state.error && (
          <motion.p
            key={state.error}
            initial={reduce ? false : { opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4 }}
            transition={softSpring}
            className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {state.error}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.div
        whileTap={reduce ? undefined : { scale: 0.98 }}
        transition={softSpring}
      >
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Signing in..." : "Sign in"}
        </Button>
      </motion.div>
    </form>
  );
}
