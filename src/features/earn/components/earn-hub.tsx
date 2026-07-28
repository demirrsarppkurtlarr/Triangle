"use client";

import { useActionState, useEffect } from "react";
import {
  Briefcase,
  Building2,
  Dices,
  Landmark,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";

import { MotionButton } from "@/components/motion/motion-button";
import {
  claimInterestAction,
  claimJobAction,
  claimQuestAction,
  claimRentAction,
  luckySpinAction,
  startJobAction,
  type EarnActionState,
} from "@/features/earn/actions/earn.actions";
import type { EarnStatus } from "@/features/earn/services/earn.service";
import { formatCurrency } from "@/utils/format";

const initial: EarnActionState = {};

type EarnHubProps = {
  status: EarnStatus;
};

export function EarnHub({ status }: EarnHubProps) {
  const [interestState, interestAction, interestPending] = useActionState(
    claimInterestAction,
    initial,
  );
  const [rentState, rentAction, rentPending] = useActionState(
    claimRentAction,
    initial,
  );
  const [jobStartState, jobStartAction, jobStartPending] = useActionState(
    startJobAction,
    initial,
  );
  const [jobClaimState, jobClaimAction, jobClaimPending] = useActionState(
    claimJobAction,
    initial,
  );
  const [spinState, spinAction, spinPending] = useActionState(
    luckySpinAction,
    initial,
  );
  const [questState, questAction, questPending] = useActionState(
    claimQuestAction,
    initial,
  );

  useEffect(() => {
    for (const state of [
      interestState,
      rentState,
      jobStartState,
      jobClaimState,
      spinState,
      questState,
    ]) {
      if (state.error) toast.error(state.error);
      if (state.success === "spin") {
        toast.message(
          state.win && state.win > 0
            ? `Kazanç: ${formatCurrency(state.win)} · Net ${formatCurrency(state.net ?? 0)}`
            : "Bu turda kazanç yok",
        );
      } else if (state.success && state.amount) {
        toast.success(`+${formatCurrency(state.amount)}`);
      } else if (state.success === "job_started") {
        toast.success("İş başladı");
      }
    }
  }, [
    interestState,
    rentState,
    jobStartState,
    jobClaimState,
    spinState,
    questState,
  ]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Bakiye:{" "}
        <span className="font-semibold text-foreground">
          {formatCurrency(status.cash)}
        </span>
        {" · "}
        Hisse dışı 5 gelir kanalı
      </p>

      <section className="grid gap-4 md:grid-cols-2">
        <EarnCard
          icon={Landmark}
          title="Banka faizi"
          body="Nakit bakiyenin ~%0.4'ü (günde bir)."
        >
          <form action={interestAction}>
            <MotionButton
              type="submit"
              className="min-h-11 w-full"
              disabled={!status.interestReady}
              pending={interestPending}
              pendingLabel="Alınıyor…"
            >
              {status.interestReady ? "Faizi al" : "Yarın tekrar"}
            </MotionButton>
          </form>
        </EarnCard>

        <EarnCard
          icon={Building2}
          title="Mülk kirası"
          body="Vitrine koyduğun evden günlük kira."
        >
          <form action={rentAction}>
            <MotionButton
              type="submit"
              className="min-h-11 w-full"
              disabled={!status.rentReady || !status.hasProperty}
              pending={rentPending}
              pendingLabel="Alınıyor…"
            >
              {!status.hasProperty
                ? "Önce ev vitrine koy"
                : status.rentReady
                  ? "Kirayı topla"
                  : "Yarın tekrar"}
            </MotionButton>
          </form>
        </EarnCard>

        <EarnCard
          icon={Dices}
          title="Şans çarkı"
          body="$25 maliyet · 3 dk'da bir · büyük ödül şansı."
        >
          <form action={spinAction}>
            <MotionButton
              type="submit"
              className="min-h-11 w-full"
              disabled={!status.lotteryReady || status.cash < 25}
              pending={spinPending}
              pendingLabel="Çevriliyor…"
            >
              {status.lotteryReady ? "Çevir ($25)" : "Bekle…"}
            </MotionButton>
          </form>
        </EarnCard>

        <EarnCard
          icon={ListChecks}
          title="Günlük görevler"
          body="Transfer · hisse al · mağazadan al."
        >
          <div className="space-y-2">
            {(
              [
                ["transfer", "Transfer yap", status.quests.transfer],
                ["stock_buy", "Hisse al", status.quests.stock_buy],
                ["shop_buy", "Mağazadan al", status.quests.shop_buy],
              ] as const
            ).map(([key, label, q]) => (
              <form key={key} action={questAction} className="flex gap-2">
                <input type="hidden" name="quest" value={key} />
                <MotionButton
                  type="submit"
                  size="sm"
                  variant={q.claimed ? "secondary" : "outline"}
                  className="min-h-10 w-full justify-between"
                  disabled={!q.done || q.claimed}
                  pending={questPending}
                  pendingLabel="…"
                >
                  <span>{label}</span>
                  <span className="text-xs text-muted-foreground">
                    {q.claimed ? "Alındı" : q.done ? "Ödülü al" : "Eksik"}
                  </span>
                </MotionButton>
              </form>
            ))}
          </div>
        </EarnCard>
      </section>

      <section className="rounded-[1.35rem] border border-border/50 bg-card/80 p-4 shadow-soft sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Briefcase className="size-4 text-primary" />
          <h2 className="font-semibold tracking-tight">Yan işler</h2>
        </div>

        {status.activeJob && !status.activeJob.claimed && (
          <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
            {status.activeJob.ready ? (
              <form action={jobClaimAction}>
                <MotionButton
                  type="submit"
                  className="min-h-11 w-full"
                  pending={jobClaimPending}
                  pendingLabel="Toplanıyor…"
                >
                  İşi bitir ve ödemeyi al
                </MotionButton>
              </form>
            ) : (
              <p className="text-muted-foreground">
                İş devam ediyor · bitiş{" "}
                {new Date(status.activeJob.completesAt).toLocaleTimeString(
                  "tr-TR",
                )}
              </p>
            )}
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          {status.jobs.map((job) => (
            <form
              key={job.id}
              action={jobStartAction}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border/50 px-3 py-3"
            >
              <input type="hidden" name="job_id" value={job.id} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{job.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(job.payMin)}–{formatCurrency(job.payMax)} ·{" "}
                  {Math.round(job.durationSec / 60)} dk
                </p>
              </div>
              <MotionButton
                type="submit"
                size="sm"
                disabled={Boolean(
                  status.activeJob && !status.activeJob.claimed,
                )}
                pending={jobStartPending}
                pendingLabel="…"
              >
                Başla
              </MotionButton>
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}

function EarnCard({
  icon: Icon,
  title,
  body,
  children,
}: {
  icon: typeof Landmark;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.35rem] border border-border/50 bg-card/80 p-4 shadow-soft sm:p-5">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
        <div>
          <p className="font-semibold tracking-tight">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
