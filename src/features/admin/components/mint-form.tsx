"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { ActionFeedback } from "@/components/motion/action-feedback";
import { MotionButton } from "@/components/motion/motion-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminMintAction,
  type AdminActionState,
} from "@/features/admin/actions/admin.actions";

const initialState: AdminActionState = {};

type MintFormProps = {
  defaultTriangleId?: string;
};

export function MintForm({ defaultTriangleId = "" }: MintFormProps) {
  const [state, formAction, isPending] = useActionState(
    adminMintAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) toast.success(state.success);
    if (state.error) toast.error(state.error);
  }, [state.success, state.error]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="mint-triangle-id">Triangle ID</Label>
        <Input
          id="mint-triangle-id"
          name="triangle_id"
          defaultValue={defaultTriangleId}
          placeholder="TR-0000-0000-0000"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="mint-amount">Amount (USD)</Label>
        <Input
          id="mint-amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="1000.00"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="mint-reason">Reason</Label>
        <Input
          id="mint-reason"
          name="reason"
          placeholder="Welcome bonus"
        />
      </div>
      <ActionFeedback error={state.error} success={state.success} />
      <MotionButton
        type="submit"
        className="w-full"
        pending={isPending}
        pendingLabel="Minting..."
      >
        Mint virtual funds
      </MotionButton>
    </form>
  );
}
