"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  adminFreezeAction,
  adminUnfreezeAction,
  type AdminActionState,
} from "@/features/admin/actions/admin.actions";

const initialState: AdminActionState = {};

type FreezeControlsProps = {
  triangleId: string;
  isFrozen: boolean;
  isAdminUser: boolean;
};

export function FreezeControls({
  triangleId,
  isFrozen,
  isAdminUser,
}: FreezeControlsProps) {
  const [freezeState, freezeAction, freezePending] = useActionState(
    adminFreezeAction,
    initialState,
  );
  const [unfreezeState, unfreezeAction, unfreezePending] = useActionState(
    adminUnfreezeAction,
    initialState,
  );

  if (isAdminUser) {
    return (
      <span className="text-xs text-muted-foreground">Protected</span>
    );
  }

  const state = isFrozen ? unfreezeState : freezeState;
  const pending = isFrozen ? unfreezePending : freezePending;

  return (
    <form action={isFrozen ? unfreezeAction : freezeAction}>
      <input type="hidden" name="triangle_id" value={triangleId} />
      {!isFrozen && (
        <input type="hidden" name="reason" value="Admin freeze" />
      )}
      <Button
        type="submit"
        size="sm"
        variant={isFrozen ? "outline" : "destructive"}
        disabled={pending}
      >
        {pending
          ? "..."
          : isFrozen
            ? "Unfreeze"
            : "Freeze"}
      </Button>
      {state.error && (
        <p className="mt-1 text-xs text-destructive">{state.error}</p>
      )}
      {state.success && (
        <p className="mt-1 text-xs text-success">{state.success}</p>
      )}
    </form>
  );
}
