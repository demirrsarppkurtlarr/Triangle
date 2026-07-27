import "server-only";

import { createClient } from "@/lib/supabase/server";

export type LeaderboardRow = {
  rank: number;
  userId: string;
  username: string;
  triangleId: string;
  cash: number;
  portfolioValue: number;
  inventoryValue: number;
  netWorth: number;
  isYou: boolean;
};

export async function getLeaderboard(
  userId: string,
  limit = 50,
): Promise<LeaderboardRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_leaderboard", {
    p_limit: limit,
  });

  if (error || !data) return [];

  return (data as Array<Record<string, unknown>>).map((row) => ({
    rank: Number(row.rank),
    userId: String(row.user_id),
    username: String(row.username),
    triangleId: String(row.triangle_id),
    cash: Number(row.cash),
    portfolioValue: Number(row.portfolio_value),
    inventoryValue: Number(row.inventory_value),
    netWorth: Number(row.net_worth),
    isYou: String(row.user_id) === userId,
  }));
}
