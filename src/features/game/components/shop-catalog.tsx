"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { MotionButton } from "@/components/motion/motion-button";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import {
  buyGameItemAction,
  type GameActionState,
} from "@/features/game/actions/game.actions";
import {
  GameItemIcon,
  RarityBadge,
} from "@/features/game/components/game-item-meta";
import {
  CATEGORY_LABELS,
  type GameCategory,
  type GameItem,
} from "@/features/game/services/game.service";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";

const initial: GameActionState = {};

const CATEGORIES: Array<GameCategory | "all"> = [
  "all",
  "vehicle",
  "property",
  "gadget",
  "collectible",
  "lifestyle",
];

type ShopCatalogProps = {
  items: GameItem[];
  cash: number;
};

export function ShopCatalog({ items, cash }: ShopCatalogProps) {
  const [category, setCategory] = useState<GameCategory | "all">("all");
  const filtered = useMemo(
    () =>
      category === "all"
        ? items
        : items.filter((item) => item.category === category),
    [category, items],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setCategory(key)}
            className={cn(
              "rounded-2xl px-3.5 py-2 text-sm font-medium transition-colors",
              category === key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/80 text-muted-foreground hover:text-foreground",
            )}
          >
            {key === "all" ? "All" : CATEGORY_LABELS[key]}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        Game cash available:{" "}
        <span className="font-semibold text-foreground">
          {formatCurrency(cash)}
        </span>
      </p>

      <Stagger className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => (
          <StaggerItem key={item.id}>
            <ShopCard item={item} />
          </StaggerItem>
        ))}
      </Stagger>

      {filtered.length === 0 && (
        <p className="rounded-3xl border border-dashed border-border/70 px-6 py-10 text-center text-sm text-muted-foreground">
          No items in this category yet.
        </p>
      )}
    </div>
  );
}

function ShopCard({ item }: { item: GameItem }) {
  const [state, formAction, pending] = useActionState(
    buyGameItemAction,
    initial,
  );

  useEffect(() => {
    if (state.success) toast.success(state.success);
    if (state.error) toast.error(state.error);
  }, [state.success, state.error]);

  return (
    <div className="flex h-full flex-col rounded-[1.35rem] border border-border/50 bg-card/80 p-4 shadow-soft backdrop-blur-xl">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <GameItemIcon icon={item.icon} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-semibold tracking-tight">{item.name}</p>
            <RarityBadge rarity={item.rarity} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {CATEGORY_LABELS[item.category]}
          </p>
        </div>
      </div>
      <p className="mb-4 flex-1 text-sm text-muted-foreground">
        {item.description}
      </p>
      <div className="flex items-center justify-between gap-3">
        <p className="text-lg font-semibold">{formatCurrency(item.shopPrice)}</p>
        <form action={formAction}>
          <input type="hidden" name="item_id" value={item.id} />
          <input type="hidden" name="quantity" value="1" />
          <MotionButton
            type="submit"
            size="sm"
            pending={pending}
            pendingLabel="Buying..."
          >
            Buy
          </MotionButton>
        </form>
      </div>
    </div>
  );
}
