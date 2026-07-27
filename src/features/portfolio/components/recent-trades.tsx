import Link from "next/link";

import type { TradeHistoryItem } from "@/features/portfolio/services/portfolio.service";
import { formatCurrency, formatRelativeTime } from "@/utils/format";
import { cn } from "@/lib/utils";

type RecentTradesProps = {
  trades: TradeHistoryItem[];
};

export function RecentTrades({ trades }: RecentTradesProps) {
  return (
    <div className="space-y-4 rounded-[1.75rem] border border-border/50 bg-card/80 p-6 shadow-soft backdrop-blur-xl">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Recent trades</h2>
        <p className="text-sm text-muted-foreground">
          Virtual buys and sells on TriangleBank
        </p>
      </div>

      {trades.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No trades yet.
        </p>
      ) : (
        <ul className="divide-y divide-border/50">
          {trades.map((trade) => (
            <li
              key={trade.id}
              className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div>
                <Link
                  href={`/stocks/${trade.symbol}`}
                  className="font-semibold hover:text-primary"
                >
                  {trade.side === "buy" ? "Bought" : "Sold"} {trade.symbol}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {trade.quantity} @ {formatCurrency(trade.price)} ·{" "}
                  {formatRelativeTime(trade.executed_at)}
                </p>
              </div>
              <p
                className={cn(
                  "text-sm font-semibold",
                  trade.side === "buy" ? "text-foreground" : "text-success",
                )}
              >
                {trade.side === "buy" ? "−" : "+"}
                {formatCurrency(trade.total)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
