"use client";

import { useActionState, useEffect } from "react";
import { Gift } from "lucide-react";
import { toast } from "sonner";

import { MotionButton } from "@/components/motion/motion-button";
import {
  claimDailyRewardAction,
  type RewardActionState,
} from "@/features/rewards/actions/rewards.actions";
import type { DailyRewardStatus } from "@/features/rewards/services/rewards.service";
import { useI18n } from "@/lib/i18n/client";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";

const initial: RewardActionState = {};

type DailyRewardCardProps = {
  status: DailyRewardStatus;
  compact?: boolean;
};

export function DailyRewardCard({ status, compact }: DailyRewardCardProps) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(
    claimDailyRewardAction,
    initial,
  );

  useEffect(() => {
    if (state.success) {
      toast.success(
        `${t.rewards.claimSuccess} · ${formatCurrency(state.amount ?? 0)}`,
      );
    }
    if (state.error) toast.error(state.error);
  }, [state.success, state.error, state.amount, t.rewards.claimSuccess]);

  return (
    <div
      className={cn(
        "rounded-[1.35rem] border border-border/50 bg-card/80 shadow-soft backdrop-blur-xl",
        compact ? "p-4" : "p-5 sm:p-6",
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Gift className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold tracking-tight">{t.rewards.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.rewards.nextAmount}:{" "}
              <span className="font-medium text-foreground">
                {formatCurrency(status.amount)}
              </span>
              {" · "}
              {t.rewards.streak} {status.claimedToday ? status.streak : status.nextStreak}/
              {status.maxStreak} {t.rewards.day}
            </p>
            {!compact && (
              <p className="mt-2 text-xs text-muted-foreground">{t.rewards.tip}</p>
            )}
          </div>
        </div>

        {status.claimedToday ? (
          <div className="rounded-2xl bg-success/10 px-4 py-2.5 text-center text-sm font-medium text-success sm:min-w-[9rem]">
            {t.rewards.claimed}
          </div>
        ) : (
          <form action={action}>
            <MotionButton
              type="submit"
              className="w-full sm:w-auto sm:min-w-[9rem]"
              pending={pending}
              pendingLabel={t.common.loading}
            >
              {t.rewards.claim}
            </MotionButton>
          </form>
        )}
      </div>
    </div>
  );
}
