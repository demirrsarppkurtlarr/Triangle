"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { useEffect, useState } from "react";

import { LiveQuoteBlock } from "@/features/stocks/components/live-price";
import { toggleFavoriteAction } from "@/features/stocks/actions/stock.actions";
import type { StockListItem } from "@/features/stocks/services/market.service";
import { cn } from "@/lib/utils";

type StockTableProps = {
  stocks: StockListItem[];
  favoritesOnly?: boolean;
};

export function StockTable({ stocks, favoritesOnly = false }: StockTableProps) {
  const rows = favoritesOnly ? stocks.filter((s) => s.isFavorite) : stocks;

  if (rows.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border/70 px-6 py-10 text-center text-sm text-muted-foreground">
        {favoritesOnly
          ? "No favorites yet. Star a stock to track it here."
          : "No symbols available."}
      </div>
    );
  }

  return (
    <ul className="space-y-2.5">
      {rows.map((stock) => (
        <li key={stock.symbol}>
          <StockHitTarget stock={stock} />
        </li>
      ))}
    </ul>
  );
}

function StockHitTarget({ stock }: { stock: StockListItem }) {
  const [favorite, setFavorite] = useState(stock.isFavorite);

  useEffect(() => {
    setFavorite(stock.isFavorite);
  }, [stock.isFavorite]);

  return (
    <div className="relative overflow-hidden rounded-[1.35rem] border border-border/50 bg-card/90 shadow-soft backdrop-blur-xl transition-colors hover:bg-secondary/40 active:bg-secondary/55">
      <Link
        href={`/stocks/${stock.symbol}`}
        prefetch
        className="absolute inset-0 z-0"
        aria-label={`Open ${stock.symbol}`}
      />

      <div className="pointer-events-none relative z-10 flex items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <p className="font-semibold tracking-tight">{stock.symbol}</p>
          <p className="truncate text-xs text-muted-foreground">{stock.name}</p>
        </div>

        <LiveQuoteBlock
          basePrice={stock.price}
          className="shrink-0 text-right"
        />

        <div className="hidden w-24 shrink-0 text-right text-sm text-muted-foreground tabular-nums sm:block">
          {stock.volume > 0 ? stock.volume.toLocaleString() : "—"}
        </div>

        <button
          type="button"
          className="pointer-events-auto touch-target relative z-20 flex shrink-0 items-center justify-center rounded-xl p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:scale-95"
          aria-label={favorite ? "Remove favorite" : "Add favorite"}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setFavorite((prev) => !prev);
            void toggleFavoriteAction(stock.symbol);
          }}
        >
          <Star
            className={cn(
              "size-5",
              favorite && "fill-primary text-primary",
            )}
          />
        </button>
      </div>
    </div>
  );
}
