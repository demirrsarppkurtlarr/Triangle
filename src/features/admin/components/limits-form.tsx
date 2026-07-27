"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { ActionFeedback } from "@/components/motion/action-feedback";
import { MotionButton } from "@/components/motion/motion-button";
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

  useEffect(() => {
    if (state.success) toast.success(state.success);
    if (state.error) toast.error(state.error);
  }, [state.success, state.error]);

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
      <ActionFeedback error={state.error} success={state.success} />
      <MotionButton type="submit" pending={isPending} pendingLabel="Saving...">
        Save limits
      </MotionButton>
    </form>
  );
}
