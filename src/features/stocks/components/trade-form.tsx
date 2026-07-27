"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buyStockAction,
  sellStockAction,
  type StockActionState,
} from "@/features/stocks/actions/stock.actions";
import { LivePrice } from "@/features/stocks/components/live-price";
import { formatCurrency } from "@/utils/format";

const initialState: StockActionState = {};

type TradeFormProps = {
  symbol: string;
  price: number;
  availableCash: number;
  ownedQuantity: number;
  side: "buy" | "sell";
};

export function TradeForm({
  symbol,
  price,
  availableCash,
  ownedQuantity,
  side,
}: TradeFormProps) {
  const action = side === "buy" ? buyStockAction : sellStockAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  const maxBuy =
    price > 0 ? Math.floor((availableCash / price) * 10000) / 10000 : 0;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="symbol" value={symbol} />

      <div className="space-y-2">
        <Label htmlFor={`${side}-qty`}>Quantity</Label>
        <Input
          id={`${side}-qty`}
          name="quantity"
          type="number"
          step="0.0001"
          min="0.0001"
          max={side === "buy" ? maxBuy || undefined : ownedQuantity}
          placeholder="1"
          required
        />
        <p className="text-xs text-muted-foreground">
          Live quote{" "}
          <LivePrice value={price} className="font-medium text-foreground" />
          {" · "}
          {side === "buy"
            ? `cash ${formatCurrency(availableCash)} · ~${maxBuy.toFixed(4)} max`
            : `you own ${ownedQuantity}`}
        </p>
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

      <Button
        type="submit"
        className="w-full"
        variant={side === "sell" ? "outline" : "default"}
        disabled={isPending || price <= 0}
      >
        {isPending
          ? "Submitting..."
          : `${side === "buy" ? "Buy" : "Sell"} ${symbol}`}
      </Button>
    </form>
  );
}
