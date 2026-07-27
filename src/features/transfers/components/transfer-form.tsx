"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { User, X } from "lucide-react";
import { useActionState, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  transferFundsAction,
  type TransferActionState,
} from "@/features/transfers/actions/transfer.actions";
import { createTransferSchema } from "@/features/transfers/schemas/transfer.schemas";
import { TriangleIdSearch } from "@/features/triangle-id/components/triangle-id-search";
import type { UserSearchResult } from "@/features/triangle-id/types";
import { formatCurrency } from "@/utils/format";
import { formatTriangleIdInput } from "@/utils/triangle-id";

const initialState: TransferActionState = {};

type TransferFormProps = {
  singleLimit: number;
  dailyLimit: number;
  dailyUsed: number;
  ownTriangleId: string;
};

export function TransferForm({
  singleLimit,
  dailyLimit,
  dailyUsed,
  ownTriangleId,
}: TransferFormProps) {
  const idempotencyKey = useRef(crypto.randomUUID());
  const [state, formAction, isPending] = useActionState(
    transferFundsAction,
    initialState,
  );

  const schema = useMemo(
    () => createTransferSchema(singleLimit),
    [singleLimit],
  );

  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      to_triangle_id: "",
      amount: undefined,
      description: "",
    },
  });

  const recipientId = watch("to_triangle_id");
  const amount = watch("amount");
  const dailyRemaining = Math.max(0, dailyLimit - dailyUsed);

  const onSubmit = handleSubmit((values) => {
    const formData = new FormData();
    formData.set("to_triangle_id", values.to_triangle_id);
    formData.set("amount", String(values.amount));
    if (values.description) formData.set("description", values.description);
    formData.set("idempotency_key", idempotencyKey.current);
    formAction(formData);
  });

  function handleRecipientSelect(user: UserSearchResult) {
    setValue("to_triangle_id", user.triangle_id, { shouldValidate: true });
  }

  function clearRecipient() {
    setValue("to_triangle_id", "", { shouldValidate: true });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-3">
        <Label>Recipient</Label>
        {!recipientId ? (
          <>
            <TriangleIdSearch
              placeholder="Search by Triangle ID or username"
              onSelect={handleRecipientSelect}
            />
            <Input
              placeholder="Or enter Triangle ID manually"
              onChange={(event) => {
                const formatted = formatTriangleIdInput(event.target.value);
                setValue("to_triangle_id", formatted, {
                  shouldValidate: formatted.length >= 17,
                });
              }}
            />
          </>
        ) : (
          <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-secondary/50 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <User className="size-4" />
              </div>
              <p className="font-mono text-sm font-medium">{recipientId}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clearRecipient}
              aria-label="Clear recipient"
            >
              <X className="size-4" />
            </Button>
          </div>
        )}
        {errors.to_triangle_id && (
          <p className="text-sm text-destructive">
            {errors.to_triangle_id.message}
          </p>
        )}
        {recipientId === ownTriangleId && recipientId !== "" && (
          <p className="text-sm text-destructive">
            You cannot send money to yourself.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount (USD)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0.01"
          max={singleLimit}
          placeholder="0.00"
          {...register("amount")}
        />
        {errors.amount && (
          <p className="text-sm text-destructive">{errors.amount.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Single limit: {formatCurrency(singleLimit)} · Daily remaining:{" "}
          {formatCurrency(dailyRemaining)}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Note (optional)</Label>
        <Input
          id="description"
          placeholder="What's this for?"
          maxLength={200}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      {state.error && (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={
          isPending ||
          !recipientId ||
          recipientId === ownTriangleId ||
          !amount ||
          Number(amount) <= 0
        }
      >
        {isPending
          ? "Sending..."
          : amount
            ? `Send ${formatCurrency(Number(amount))}`
            : "Send money"}
      </Button>
    </form>
  );
}
