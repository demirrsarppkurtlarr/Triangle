"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminUpdateLimitsAction,
  type AdminActionState,
} from "@/features/admin/actions/admin.actions";

const initialState: AdminActionState = {};

type LimitsFormProps = {
  singleLimit: number;
  dailyLimit: number;
};

export function LimitsForm({ singleLimit, dailyLimit }: LimitsFormProps) {
  const [state, formAction, isPending] = useActionState(
    adminUpdateLimitsAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="single_limit">Single transfer limit (USD)</Label>
        <Input
          id="single_limit"
          name="single_limit"
          type="number"
          step="1"
          min="1"
          defaultValue={singleLimit}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="daily_limit">Daily transfer limit (USD)</Label>
        <Input
          id="daily_limit"
          name="daily_limit"
          type="number"
          step="1"
          min="1"
          defaultValue={dailyLimit}
          required
        />
      </div>
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
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save limits"}
      </Button>
    </form>
  );
}
