"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
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
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Minting..." : "Mint virtual funds"}
      </Button>
    </form>
  );
}
