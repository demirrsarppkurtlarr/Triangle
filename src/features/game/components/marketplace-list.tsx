"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { MotionButton } from "@/components/motion/motion-button";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import {
  buyListingAction,
  cancelListingAction,
  type GameActionState,
} from "@/features/game/actions/game.actions";
import {
  GameItemIcon,
  RarityBadge,
} from "@/features/game/components/game-item-meta";
import {
  CATEGORY_LABELS,
  type MarketplaceListing,
} from "@/features/game/services/game.service";
import { formatCurrency } from "@/utils/format";

const initial: GameActionState = {};

type MarketplaceListProps = {
  listings: MarketplaceListing[];
};

export function MarketplaceList({ listings }: MarketplaceListProps) {
  if (listings.length === 0) {
    return (
      <p className="rounded-3xl border border-dashed border-border/70 px-6 py-10 text-center text-sm text-muted-foreground">
        No active listings. List something from your inventory to start trading.
      </p>
    );
  }

  return (
    <Stagger className="space-y-3">
      {listings.map((listing) => (
        <StaggerItem key={listing.id}>
          <ListingCard listing={listing} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}

function ListingCard({ listing }: { listing: MarketplaceListing }) {
  const [buyState, buyAction, buyPending] = useActionState(
    buyListingAction,
    initial,
  );
  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelListingAction,
    initial,
  );

  useEffect(() => {
    if (buyState.success) toast.success(buyState.success);
    if (buyState.error) toast.error(buyState.error);
  }, [buyState.success, buyState.error]);

  useEffect(() => {
    if (cancelState.success) toast.success(cancelState.success);
    if (cancelState.error) toast.error(cancelState.error);
  }, [cancelState.success, cancelState.error]);

  return (
    <div className="flex flex-col gap-4 rounded-[1.35rem] border border-border/50 bg-card/80 p-4 shadow-soft backdrop-blur-xl sm:flex-row sm:items-center sm:p-5">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <GameItemIcon icon={listing.item.icon} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold tracking-tight">{listing.item.name}</p>
            <RarityBadge rarity={listing.item.rarity} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {CATEGORY_LABELS[listing.item.category]} · qty {listing.quantity} ·
            seller @{listing.sellerUsername}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {listing.item.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
        <p className="text-lg font-semibold">{formatCurrency(listing.price)}</p>
        {listing.isMine ? (
          <form action={cancelAction}>
            <input type="hidden" name="listing_id" value={listing.id} />
            <MotionButton
              type="submit"
              variant="outline"
              size="sm"
              pending={cancelPending}
              pendingLabel="Cancelling..."
            >
              Cancel listing
            </MotionButton>
          </form>
        ) : (
          <form action={buyAction}>
            <input type="hidden" name="listing_id" value={listing.id} />
            <MotionButton
              type="submit"
              size="sm"
              pending={buyPending}
              pendingLabel="Buying..."
            >
              Buy listing
            </MotionButton>
          </form>
        )}
      </div>
    </div>
  );
}
