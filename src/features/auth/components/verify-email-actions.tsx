"use client";

import { useActionState } from "react";

import {
  resendVerificationAction,
  type AuthActionState,
} from "@/features/auth/actions/auth.actions";
import { Button } from "@/components/ui/button";

const initialState: AuthActionState = {};

type VerifyEmailActionsProps = {
  email: string;
};

export function VerifyEmailActions({ email }: VerifyEmailActionsProps) {
  const [state, formAction, isPending] = useActionState(
    resendVerificationAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="email" value={email} />

      {state.error && (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      {state.success && (
        <p className="rounded-xl bg-success/10 px-4 py-3 text-sm text-success">
          {state.success}
        </p>
      )}

      <Button type="submit" variant="outline" disabled={isPending}>
        {isPending ? "Sending..." : "Resend verification email"}
      </Button>
    </form>
  );
}
