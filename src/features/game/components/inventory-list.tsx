"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { MotionButton } from "@/components/motion/motion-button";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import {
  listInventoryItemAction,
  sellGameItemAction,
  type GameActionState,
} from "@/features/game/actions/game.actions";
import {
  GameItemIcon,
  RarityBadge,
  sellBackPrice,
} from "@/features/game/components/game-item-meta";
import {
  CATEGORY_LABELS,
  type InventoryRow,
} from "@/features/game/types";
import { formatCurrency } from "@/utils/format";

const initial: GameActionState = {};

type InventoryListProps = {
  rows: InventoryRow[];
};

export function InventoryList({ rows }: InventoryListProps) {
  if (rows.length === 0) {
    return (
      <p className="rounded-3xl border border-dashed border-border/70 px-6 py-10 text-center text-sm text-muted-foreground">
        Empty inventory. Visit the shop to pick up cars, homes, and gadgets.
      </p>
    );
  }

  return (
    <Stagger className="space-y-3">
      {rows.map((row) => (
        <StaggerItem key={row.id}>
          <InventoryCard row={row} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}

function InventoryCard({ row }: { row: InventoryRow }) {
  const [listPrice, setListPrice] = useState(
    String(Math.round(row.item.shopPrice * 0.9)),
  );
  const [sellState, sellAction, sellPending] = useActionState(
    sellGameItemAction,
    initial,
  );
  const [listState, listAction, listPending] = useActionState(
    listInventoryItemAction,
    initial,
  );

  useEffect(() => {
    if (sellState.success) toast.success(sellState.success);
    if (sellState.error) toast.error(sellState.error);
  }, [sellState.success, sellState.error]);

  useEffect(() => {
    if (listState.success) toast.success(listState.success);
    if (listState.error) toast.error(listState.error);
  }, [listState.success, listState.error]);

  const buyback = sellBackPrice(row.item);

  return (
    <div className="rounded-[1.35rem] border border-border/50 bg-card/80 p-4 shadow-soft backdrop-blur-xl sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-foreground">
            <GameItemIcon icon={row.item.icon} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold tracking-tight">{row.item.name}</p>
              <RarityBadge rarity={row.item.rarity} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {CATEGORY_LABELS[row.item.category]} · qty {row.quantity} · paid{" "}
              {formatCurrency(row.purchasePrice)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {row.item.description}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-56">
          <form action={sellAction} className="flex gap-2">
            <input type="hidden" name="item_id" value={row.itemId} />
            <input type="hidden" name="quantity" value="1" />
            <MotionButton
              type="submit"
              variant="outline"
              size="sm"
              className="w-full"
              pending={sellPending}
              pendingLabel="Selling..."
            >
              Sell to shop · {formatCurrency(buyback)}
            </MotionButton>
          </form>

          <form action={listAction} className="space-y-2">
            <input type="hidden" name="item_id" value={row.itemId} />
            <input type="hidden" name="quantity" value="1" />
            <label className="block text-xs text-muted-foreground">
              Marketplace price
              <input
                name="price"
                type="number"
                min="0.01"
                step="0.01"
                value={listPrice}
                onChange={(e) => setListPrice(e.target.value)}
                className="mt-1 h-9 w-full rounded-xl border border-border/60 bg-background px-3 text-sm"
              />
            </label>
            <MotionButton
              type="submit"
              size="sm"
              className="w-full"
              pending={listPending}
              pendingLabel="Listing..."
            >
              List on marketplace
            </MotionButton>
          </form>
        </div>
      </div>
    </div>
  );
}
