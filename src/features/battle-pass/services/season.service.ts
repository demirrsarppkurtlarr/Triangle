import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n/dictionaries";

export type Season = {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
};

export type Mission = {
  id: string;
  titleEn: string;
  titleTr: string;
  descriptionEn: string;
  descriptionTr: string;
  missionType: string;
  targetValue: number;
  xpReward: number;
  cashReward: number;
  currentValue: number;
  completed: boolean;
  claimed: boolean;
};

export type SeasonXp = {
  totalXp: number;
  level: number;
};

export async function getSeasonData(userId: string, locale: Locale) {
  const supabase = await createClient();

  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();

  if (!season) return null;

  const [{ data: missions }, { data: progress }, { data: xp }] =
    await Promise.all([
      supabase
        .from("season_missions")
        .select("*")
        .eq("season_id", season.id)
        .order("sort_order"),
      supabase
        .from("user_season_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("season_id", season.id),
      supabase
        .from("user_season_xp")
        .select("*")
        .eq("user_id", userId)
        .eq("season_id", season.id)
        .maybeSingle(),
    ]);

  const progressMap = new Map(
    (progress ?? []).map((p) => [p.mission_id, p]),
  );

  return {
    season: {
      id: season.id,
      name: season.name,
      startsAt: season.starts_at,
      endsAt: season.ends_at,
    },
    missions: (missions ?? []).map((m) => {
      const p = progressMap.get(m.id);
      return {
        id: m.id,
        titleEn: m.title_en,
        titleTr: m.title_tr,
        descriptionEn: m.description_en,
        descriptionTr: m.description_tr,
        missionType: m.mission_type,
        targetValue: m.target_value,
        xpReward: m.xp_reward,
        cashReward: Number(m.cash_reward),
        currentValue: p?.current_value ?? 0,
        completed: p?.completed ?? false,
        claimed: p?.claimed ?? false,
      };
    }),
    xp: xp
      ? { totalXp: xp.total_xp, level: xp.level }
      : { totalXp: 0, level: 1 },
    locale,
  };
}
