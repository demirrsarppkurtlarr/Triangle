"use client";

import { Trophy } from "lucide-react";

import type { LeaderboardRow } from "@/features/leaderboard/services/leaderboard.service";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format";

type LeaderboardTableProps = {
  rows: LeaderboardRow[];
};

export function LeaderboardTable({ rows }: LeaderboardTableProps) {
  const { t } = useI18n();
  const you = rows.find((r) => r.isYou);

  if (rows.length === 0) {
    return (
      <p className="rounded-3xl border border-dashed border-border/70 px-6 py-10 text-center text-sm text-muted-foreground">
        {t.leaderboard.empty}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {you && (
        <div className="flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm">
          <Trophy className="size-4 text-primary" />
          <span className="font-medium">
            {t.leaderboard.yourRank}: #{you.rank}
          </span>
          <span className="ml-auto font-semibold">
            {formatCurrency(you.netWorth)}
          </span>
        </div>
      )}

      <div className="overflow-x-auto rounded-[1.35rem] border border-border/50 bg-card/80 shadow-soft">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="border-b border-border/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">{t.leaderboard.rank}</th>
              <th className="px-4 py-3 font-medium">{t.leaderboard.player}</th>
              <th className="px-4 py-3 font-medium">{t.leaderboard.cash}</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">
                {t.leaderboard.portfolio}
              </th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">
                {t.leaderboard.inventory}
              </th>
              <th className="px-4 py-3 font-medium">{t.leaderboard.netWorth}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.userId}
                className={cn(
                  "border-b border-border/40 last:border-0",
                  row.isYou && "bg-primary/5",
                )}
              >
                <td className="px-4 py-3 font-mono text-muted-foreground">
                  #{row.rank}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">
                    @{row.username}
                    {row.isYou ? ` · ${t.common.you}` : ""}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {row.triangleId}
                  </p>
                </td>
                <td className="px-4 py-3">{formatCurrency(row.cash)}</td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  {formatCurrency(row.portfolioValue)}
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  {formatCurrency(row.inventoryValue)}
                </td>
                <td className="px-4 py-3 font-semibold">
                  {formatCurrency(row.netWorth)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
