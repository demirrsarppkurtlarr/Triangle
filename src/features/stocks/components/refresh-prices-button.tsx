"use client";

import { useActionState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { MotionButton } from "@/components/motion/motion-button";
import { refreshMarketPricesFormAction } from "@/features/stocks/actions/refresh.action";
import type { StockActionState } from "@/features/stocks/actions/stock.actions";

const initialState: StockActionState = {};

type RefreshPricesButtonProps = {
  className?: string;
};

export function RefreshPricesButton({ className }: RefreshPricesButtonProps) {
  const [state, formAction, isPending] = useActionState(
    refreshMarketPricesFormAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) toast.success(state.success);
    if (state.error) toast.error(state.error);
  }, [state.success, state.error]);

  return (
    <form action={formAction} className={className}>
      <MotionButton
        type="submit"
        variant="outline"
        size="sm"
        pending={isPending}
        pendingLabel="Refreshing..."
      >
        <RefreshCw className="size-4" />
        Refresh prices
      </MotionButton>
    </form>
  );
}
