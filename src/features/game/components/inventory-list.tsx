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
  equipShowcaseAction,
  type ShowcaseActionState,
} from "@/features/game/actions/showcase.actions";
import {
  GameItemIcon,
  RarityBadge,
  sellBackPrice,
} from "@/features/game/components/game-item-meta";
import {
  CATEGORY_LABELS,
  type GameCategory,
  type InventoryRow,
} from "@/features/game/types";
import type { UserPreferences } from "@/features/settings/services/settings.service";
import { useI18n } from "@/lib/i18n/client";
import { formatCurrency } from "@/utils/format";

const initial: GameActionState = {};
const showcaseInitial: ShowcaseActionState = {};

type InventoryListProps = {
  rows: InventoryRow[];
  preferences: UserPreferences;
};

function slotForCategory(category: GameCategory): string | null {
  if (category === "vehicle") return "vehicle";
  if (category === "property") return "property";
  if (category === "gadget") return "gadget";
  if (category === "collectible" || category === "lifestyle") return "collectible";
  return null;
}

export function InventoryList({ rows, preferences }: InventoryListProps) {
  const { t } = useI18n();

  const equipped = new Set(
    [
      preferences.showcaseVehicleId,
      preferences.showcasePropertyId,
      preferences.showcaseGadgetId,
      preferences.showcaseCollectibleId,
    ].filter(Boolean),
  );

  if (rows.length === 0) {
    return (
      <p className="rounded-3xl border border-dashed border-border/70 px-6 py-10 text-center text-sm text-muted-foreground">
        {t.inventory.empty}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <ShowcasePanel rows={rows} preferences={preferences} />
      <Stagger className="space-y-3">
        {rows.map((row) => (
          <StaggerItem key={row.id}>
            <InventoryCard
              row={row}
              equipped={equipped.has(row.itemId)}
            />
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}

function ShowcasePanel({
  rows,
  preferences,
}: {
  rows: InventoryRow[];
  preferences: UserPreferences;
}) {
  const { t } = useI18n();
  const slots = [
    {
      key: "vehicle" as const,
      label: t.inventory.garage,
      id: preferences.showcaseVehicleId,
    },
    {
      key: "property" as const,
      label: t.inventory.home,
      id: preferences.showcasePropertyId,
    },
    {
      key: "gadget" as const,
      label: t.inventory.desk,
      id: preferences.showcaseGadgetId,
    },
    {
      key: "collectible" as const,
      label: t.inventory.display,
      id: preferences.showcaseCollectibleId,
    },
  ];

  const byId = new Map(rows.map((r) => [r.itemId, r]));

  return (
    <section className="rounded-[1.35rem] border border-border/50 bg-card/80 p-4 shadow-soft sm:p-5">
      <h2 className="font-semibold tracking-tight">{t.inventory.showcase}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t.inventory.showcaseHint}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {slots.map((slot) => {
          const item = slot.id ? byId.get(slot.id)?.item : null;
          return (
            <div
              key={slot.key}
              className="rounded-2xl border border-border/50 bg-secondary/40 p-3"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {slot.label}
              </p>
              {item ? (
                <div className="mt-2 flex items-center gap-2">
                  <GameItemIcon icon={item.icon} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <RarityBadge rarity={item.rarity} />
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">—</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function InventoryCard({
  row,
  equipped,
}: {
  row: InventoryRow;
  equipped: boolean;
}) {
  const { t } = useI18n();
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
  const [equipState, equipAction, equipPending] = useActionState(
    equipShowcaseAction,
    showcaseInitial,
  );

  useEffect(() => {
    if (sellState.success) toast.success(sellState.success);
    if (sellState.error) toast.error(sellState.error);
  }, [sellState.success, sellState.error]);

  useEffect(() => {
    if (listState.success) toast.success(listState.success);
    if (listState.error) toast.error(listState.error);
  }, [listState.success, listState.error]);

  useEffect(() => {
    if (equipState.success) toast.success(t.inventory.equipped);
    if (equipState.error) toast.error(equipState.error);
  }, [equipState.success, equipState.error, t.inventory.equipped]);

  const buyback = sellBackPrice(row.item);
  const slot = slotForCategory(row.item.category);

  return (
    <div className="rounded-[1.35rem] border border-border/50 bg-card/80 p-4 shadow-soft backdrop-blur-xl sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-foreground">
            <GameItemIcon icon={row.item.icon} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold tracking-tight">{row.item.name}</p>
              <RarityBadge rarity={row.item.rarity} />
              {equipped && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {t.inventory.equipped}
                </span>
              )}
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

        <div className="flex w-full flex-col gap-2 lg:w-60">
          {slot && (
            <form action={equipAction} className="flex gap-2">
              <input type="hidden" name="slot" value={slot} />
              <input
                type="hidden"
                name="item_id"
                value={equipped ? "none" : row.itemId}
              />
              <MotionButton
                type="submit"
                variant="secondary"
                size="sm"
                className="min-h-10 w-full"
                pending={equipPending}
                pendingLabel={t.common.loading}
              >
                {equipped ? t.inventory.unequip : t.inventory.equip}
              </MotionButton>
            </form>
          )}

          <form action={sellAction} className="flex gap-2">
            <input type="hidden" name="item_id" value={row.itemId} />
            <input type="hidden" name="quantity" value="1" />
            <MotionButton
              type="submit"
              variant="outline"
              size="sm"
              className="min-h-10 w-full"
              pending={sellPending}
              pendingLabel="Selling..."
            >
              {t.inventory.sellShop} · {formatCurrency(buyback)}
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
                inputMode="decimal"
                value={listPrice}
                onChange={(e) => setListPrice(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-border/60 bg-background px-3 text-sm"
              />
            </label>
            <MotionButton
              type="submit"
              size="sm"
              className="min-h-10 w-full"
              pending={listPending}
              pendingLabel="Listing..."
            >
              {t.inventory.listMarket}
            </MotionButton>
          </form>
        </div>
      </div>
    </div>
  );
}
