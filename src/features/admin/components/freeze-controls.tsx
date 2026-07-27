"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { MotionButton } from "@/components/motion/motion-button";
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
  const [frozen, setFrozen] = useState(isFrozen);
  const [freezeState, freezeAction, freezePending] = useActionState(
    adminFreezeAction,
    initialState,
  );
  const [unfreezeState, unfreezeAction, unfreezePending] = useActionState(
    adminUnfreezeAction,
    initialState,
  );

  useEffect(() => {
    setFrozen(isFrozen);
  }, [isFrozen]);

  useEffect(() => {
    if (freezeState.success) {
      setFrozen(true);
      toast.success(freezeState.success);
    }
    if (freezeState.error) toast.error(freezeState.error);
  }, [freezeState.success, freezeState.error]);

  useEffect(() => {
    if (unfreezeState.success) {
      setFrozen(false);
      toast.success(unfreezeState.success);
    }
    if (unfreezeState.error) toast.error(unfreezeState.error);
  }, [unfreezeState.success, unfreezeState.error]);

  if (isAdminUser) {
    return <span className="text-xs text-muted-foreground">Protected</span>;
  }

  const pending = frozen ? unfreezePending : freezePending;

  return (
    <form action={frozen ? unfreezeAction : freezeAction}>
      <input type="hidden" name="triangle_id" value={triangleId} />
      {!frozen && (
        <input type="hidden" name="reason" value="Admin freeze" />
      )}
      <MotionButton
        type="submit"
        size="sm"
        variant={frozen ? "outline" : "destructive"}
        pending={pending}
        pendingLabel="…"
        className="min-w-[5.5rem]"
      >
        {frozen ? "Unfreeze" : "Freeze"}
      </MotionButton>
    </form>
  );
}
