import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n/dictionaries";

export type SideJob = {
  id: string;
  slug: string;
  title: string;
  payMin: number;
  payMax: number;
  durationSec: number;
  icon: string;
};

export type ActiveJob = {
  jobId: string;
  completesAt: string;
  claimed: boolean;
  ready: boolean;
} | null;

export type EarnStatus = {
  interestReady: boolean;
  rentReady: boolean;
  hasProperty: boolean;
  lotteryReady: boolean;
  quests: {
    transfer: { done: boolean; claimed: boolean };
    stock_buy: { done: boolean; claimed: boolean };
    shop_buy: { done: boolean; claimed: boolean };
  };
  jobs: SideJob[];
  activeJob: ActiveJob;
  cash: number;
};

function istanbulToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function sameIstanbulDay(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
  return day === istanbulToday();
}

export async function getEarnStatus(
  userId: string,
  locale: Locale,
): Promise<EarnStatus> {
  const supabase = await createClient();

  const [
    { data: cooldowns },
    { data: prefs },
    { data: account },
    { data: jobs },
    { data: active },
    { data: transfersToday },
    { data: tradesToday },
    { data: shopToday },
  ] = await Promise.all([
    supabase
      .from("income_cooldowns")
      .select("kind, last_at")
      .eq("user_id", userId),
    supabase
      .from("user_preferences")
      .select("showcase_property_id")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("bank_accounts")
      .select("balance, id")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("side_jobs")
      .select("id, slug, title_en, title_tr, pay_min, pay_max, duration_sec, icon")
      .eq("is_active", true)
      .order("pay_min"),
    supabase
      .from("active_jobs")
      .select("job_id, completes_at, claimed")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("transactions")
      .select("id, from_account_id, completed_at, type, status")
      .eq("type", "transfer")
      .eq("status", "completed")
      .limit(30),
    supabase
      .from("trades")
      .select("id, side, executed_at")
      .eq("user_id", userId)
      .eq("side", "buy")
      .limit(30),
    supabase
      .from("transactions")
      .select("id, from_account_id, completed_at, type, status")
      .eq("type", "game_purchase")
      .eq("status", "completed")
      .limit(30),
  ]);

  const cd = new Map((cooldowns ?? []).map((c) => [c.kind, c.last_at]));
  const interestLast = cd.get("interest");
  const rentLast = cd.get("rent");
  const lotteryLast = cd.get("lottery");

  const interestReady =
    !interestLast ||
    Date.now() - new Date(interestLast).getTime() > 20 * 60 * 60 * 1000;
  const rentReady =
    !rentLast ||
    Date.now() - new Date(rentLast).getTime() > 20 * 60 * 60 * 1000;
  const lotteryReady =
    !lotteryLast ||
    Date.now() - new Date(lotteryLast).getTime() > 3 * 60 * 1000;

  const accountId = account?.id;
  const transferDone = (transfersToday ?? []).some(
    (t) =>
      t.from_account_id === accountId && sameIstanbulDay(t.completed_at),
  );
  const stockDone = (tradesToday ?? []).some((t) =>
    sameIstanbulDay(t.executed_at),
  );
  const shopDone = (shopToday ?? []).some(
    (t) =>
      t.from_account_id === accountId && sameIstanbulDay(t.completed_at),
  );

  return {
    interestReady,
    rentReady,
    hasProperty: Boolean(prefs?.showcase_property_id),
    lotteryReady,
    quests: {
      transfer: {
        done: transferDone,
        claimed: sameIstanbulDay(cd.get("quest_transfer")),
      },
      stock_buy: {
        done: stockDone,
        claimed: sameIstanbulDay(cd.get("quest_stock_buy")),
      },
      shop_buy: {
        done: shopDone,
        claimed: sameIstanbulDay(cd.get("quest_shop_buy")),
      },
    },
    jobs: (jobs ?? []).map((j) => ({
      id: j.id,
      slug: j.slug,
      title: locale === "tr" ? j.title_tr : j.title_en,
      payMin: Number(j.pay_min),
      payMax: Number(j.pay_max),
      durationSec: Number(j.duration_sec),
      icon: j.icon,
    })),
    activeJob: active
      ? {
          jobId: active.job_id,
          completesAt: active.completes_at,
          claimed: Boolean(active.claimed),
          ready:
            !active.claimed &&
            new Date(active.completes_at).getTime() <= Date.now(),
        }
      : null,
    cash: Number(account?.balance ?? 0),
  };
}
