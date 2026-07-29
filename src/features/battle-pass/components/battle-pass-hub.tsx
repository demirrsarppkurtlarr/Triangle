"use client";

import { useActionState, useEffect } from "react";
import { Flame, Star, Trophy } from "lucide-react";
import { toast } from "sonner";

import { MotionButton } from "@/components/motion/motion-button";
import {
  claimMissionAction,
  type SeasonActionState,
} from "@/features/battle-pass/actions/season.actions";
import type { Mission, Season, SeasonXp } from "@/features/battle-pass/services/season.service";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";

const initial: SeasonActionState = {};

type Props = {
  season: Season;
  missions: Mission[];
  xp: SeasonXp;
  locale: string;
};

export function BattlePassHub({ season, missions, xp, locale }: Props) {
  const [state, action, pending] = useActionState(claimMissionAction, initial);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) toast.success(state.success);
  }, [state]);

  const daysLeft = Math.max(0, Math.ceil((new Date(season.endsAt).getTime() - Date.now()) / 86400000));
  const xpForNext = (xp.level) * 500;
  const xpProgress = Math.min(100, (xp.totalXp / xpForNext) * 100);

  return (
    <div className="space-y-6">
      <div className="rounded-[1.35rem] border border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10 p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold tracking-tight">{season.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{daysLeft} gün kaldı</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5">
              <Star className="size-4 text-primary" />
              <span className="text-2xl font-semibold">Lv. {xp.level}</span>
            </div>
            <p className="text-xs text-muted-foreground">{xp.totalXp} XP</p>
          </div>
        </div>
        <div className="mt-3">
          <div className="h-2 rounded-full bg-secondary">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {xp.totalXp} / {xpForNext} XP — Sonraki seviye
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Trophy className="size-4 text-primary" />
          <h2 className="font-semibold tracking-tight">Görevler</h2>
        </div>
        {missions.map((m) => {
          const title = locale === "tr" ? m.titleTr : m.titleEn;
          const desc = locale === "tr" ? m.descriptionTr : m.descriptionEn;
          const progress = Math.min(100, (m.currentValue / m.targetValue) * 100);

          return (
            <div key={m.id} className={cn(
              "rounded-[1.35rem] border bg-card/80 p-4 shadow-soft",
              m.claimed ? "border-border/50 opacity-60" : m.completed ? "border-success/30" : "border-border/50",
            )}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold">{title}</p>
                  {desc && <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>}
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-1.5 flex-1 rounded-full bg-secondary">
                      <div
                        className={cn("h-1.5 rounded-full transition-all", m.completed ? "bg-success" : "bg-primary")}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {m.currentValue}/{m.targetValue}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-1 text-xs text-primary">
                    <Flame className="size-3" />
                    {m.xpReward} XP
                  </div>
                  {m.cashReward > 0 && (
                    <p className="text-xs text-muted-foreground">{formatCurrency(m.cashReward)}</p>
                  )}
                </div>
              </div>
              {m.completed && !m.claimed && (
                <form action={action} className="mt-3">
                  <input type="hidden" name="mission_id" value={m.id} />
                  <MotionButton type="submit" size="sm" className="min-h-10 w-full" pending={pending} pendingLabel="…">
                    Ödülü al
                  </MotionButton>
                </form>
              )}
              {m.claimed && (
                <p className="mt-2 text-center text-xs text-muted-foreground">Alındı ✓</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
