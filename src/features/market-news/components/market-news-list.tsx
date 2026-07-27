"use client";

import { useActionState, useEffect } from "react";
import { Newspaper } from "lucide-react";
import { toast } from "sonner";

import { MotionButton } from "@/components/motion/motion-button";
import {
  applyMarketNewsAction,
  type NewsActionState,
} from "@/features/market-news/actions/news.actions";
import type { MarketNewsItem } from "@/features/market-news/services/news.service";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/utils/format";

const initial: NewsActionState = {};

type MarketNewsListProps = {
  items: MarketNewsItem[];
};

export function MarketNewsList({ items }: MarketNewsListProps) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(
    applyMarketNewsAction,
    initial,
  );

  useEffect(() => {
    if (state.success) toast.success(t.news.applied);
    if (state.error) toast.error(state.error);
  }, [state.success, state.error, t.news.applied]);

  if (items.length === 0) {
    return (
      <p className="rounded-3xl border border-dashed border-border/70 px-6 py-10 text-center text-sm text-muted-foreground">
        {t.news.empty}
      </p>
    );
  }

  const pendingApply = items.some((i) => !i.appliedAt);

  return (
    <div className="space-y-4">
      {pendingApply && (
        <form action={action} className="flex justify-end">
          <MotionButton
            type="submit"
            size="sm"
            pending={pending}
            pendingLabel={t.common.loading}
          >
            {t.news.apply}
          </MotionButton>
        </form>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-[1.35rem] border border-border/50 bg-card/80 p-4 shadow-soft sm:p-5"
          >
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-secondary">
                <Newspaper className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold tracking-tight">{item.title}</h3>
                  <SentimentPill sentiment={item.sentiment} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>
                    {t.news.impact}: {item.impactPercent > 0 ? "+" : ""}
                    {item.impactPercent}%
                  </span>
                  <span>·</span>
                  <span>{formatRelativeTime(item.publishedAt)}</span>
                  {item.symbols.length > 0 && (
                    <>
                      <span>·</span>
                      <span className="font-mono">
                        {t.news.symbols}: {item.symbols.join(", ")}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function SentimentPill({
  sentiment,
}: {
  sentiment: MarketNewsItem["sentiment"];
}) {
  const { t } = useI18n();
  const label =
    sentiment === "bullish"
      ? t.news.bullish
      : sentiment === "bearish"
        ? t.news.bearish
        : t.news.neutral;

  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        sentiment === "bullish" && "bg-success/15 text-success",
        sentiment === "bearish" && "bg-destructive/15 text-destructive",
        sentiment === "neutral" && "bg-secondary text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}
