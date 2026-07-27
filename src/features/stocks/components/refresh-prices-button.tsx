"use client";

import { useActionState } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
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

  return (
    <form action={formAction} className={className}>
      <Button type="submit" variant="outline" size="sm" disabled={isPending}>
        <RefreshCw className={`size-4 ${isPending ? "animate-spin" : ""}`} />
        {isPending ? "Refreshing..." : "Refresh prices"}
      </Button>
      {state.error && (
        <p className="mt-2 text-xs text-destructive">{state.error}</p>
      )}
      {state.success && (
        <p className="mt-2 text-xs text-success">{state.success}</p>
      )}
    </form>
  );
}
