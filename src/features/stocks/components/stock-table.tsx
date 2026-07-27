"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { useTransition } from "react";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { toggleFavoriteAction } from "@/features/stocks/actions/stock.actions";
import type { StockListItem } from "@/features/stocks/services/market.service";
import { formatCurrency } from "@/utils/format";
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
    <>
      <Stagger as="ul" className="space-y-2.5 md:hidden" fast>
        {rows.map((stock) => (
          <StaggerItem key={stock.symbol} as="li">
            <StockCard stock={stock} />
          </StaggerItem>
        ))}
      </Stagger>

      <div className="hidden overflow-hidden rounded-3xl border border-border/50 bg-card/80 shadow-soft md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 text-muted-foreground">
              <th className="px-4 py-3 font-medium">Symbol</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Change</th>
              <th className="px-4 py-3 font-medium">Volume</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((stock) => (
              <StockRow key={stock.symbol} stock={stock} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function StockCard({ stock }: { stock: StockListItem }) {
  const [isPending, startTransition] = useTransition();
  const up = stock.changePercent >= 0;

  return (
    <div className="rounded-[1.35rem] border border-border/50 bg-card/90 shadow-soft backdrop-blur-xl">
      <div className="flex items-center gap-3 p-4">
        <Link href={`/stocks/${stock.symbol}`} className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold tracking-tight">{stock.symbol}</p>
              <p className="truncate text-xs text-muted-foreground">
                {stock.name}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-semibold">
                {stock.price > 0 ? formatCurrency(stock.price) : "—"}
              </p>
              <p
                className={cn(
                  "text-xs font-medium",
                  up ? "text-success" : "text-destructive",
                )}
              >
                {up ? "+" : ""}
                {stock.changePercent.toFixed(2)}%
              </p>
            </div>
          </div>
        </Link>
        <button
          type="button"
          disabled={isPending}
          className="touch-target flex shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label={stock.isFavorite ? "Remove favorite" : "Add favorite"}
          onClick={() => {
            startTransition(async () => {
              await toggleFavoriteAction(stock.symbol);
            });
          }}
        >
          <Star
            className={cn(
              "size-5 transition-transform",
              stock.isFavorite && "fill-primary text-primary scale-110",
            )}
          />
        </button>
      </div>
    </div>
  );
}

function StockRow({ stock }: { stock: StockListItem }) {
  const [isPending, startTransition] = useTransition();
  const up = stock.changePercent >= 0;

  return (
    <tr className="border-b border-border/40 last:border-0">
      <td className="px-4 py-3">
        <Link
          href={`/stocks/${stock.symbol}`}
          className="font-semibold text-foreground hover:text-primary"
        >
          {stock.symbol}
        </Link>
        <p className="text-xs text-muted-foreground">{stock.name}</p>
      </td>
      <td className="px-4 py-3 font-medium">
        {stock.price > 0 ? formatCurrency(stock.price) : "—"}
      </td>
      <td
        className={cn(
          "px-4 py-3 font-medium",
          up ? "text-success" : "text-destructive",
        )}
      >
        {up ? "+" : ""}
        {stock.changePercent.toFixed(2)}%
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {stock.volume > 0 ? stock.volume.toLocaleString() : "—"}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          disabled={isPending}
          className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label={stock.isFavorite ? "Remove favorite" : "Add favorite"}
          onClick={() => {
            startTransition(async () => {
              await toggleFavoriteAction(stock.symbol);
            });
          }}
        >
          <Star
            className={cn(
              "size-4",
              stock.isFavorite && "fill-primary text-primary",
            )}
          />
        </button>
      </td>
    </tr>
  );
}
