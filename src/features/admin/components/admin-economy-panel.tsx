"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  adminCreateMarketNewsAction,
  adminToggleGameItemAction,
  adminUpdateEconomySettingAction,
  type AdminEconomyActionState,
} from "@/features/admin/actions/economy.actions";
import type {
  AdminGameItem,
  EconomySettings,
} from "@/features/admin/services/economy.service";
import { useI18n } from "@/lib/i18n/client";
import { formatCurrency } from "@/utils/format";

const initial: AdminEconomyActionState = {};

type AdminEconomyPanelProps = {
  settings: EconomySettings;
  items: AdminGameItem[];
};

export function AdminEconomyPanel({
  settings,
  items,
}: AdminEconomyPanelProps) {
  const { t } = useI18n();
  const [settingState, settingAction, settingPending] = useActionState(
    adminUpdateEconomySettingAction,
    initial,
  );
  const [newsState, newsAction, newsPending] = useActionState(
    adminCreateMarketNewsAction,
    initial,
  );
  const [itemState, itemAction, itemPending] = useActionState(
    adminToggleGameItemAction,
    initial,
  );

  useEffect(() => {
    if (settingState.success) toast.success(settingState.success);
    if (settingState.error) toast.error(settingState.error);
  }, [settingState.success, settingState.error]);

  useEffect(() => {
    if (newsState.success) toast.success(newsState.success);
    if (newsState.error) toast.error(newsState.error);
  }, [newsState.success, newsState.error]);

  useEffect(() => {
    if (itemState.success) toast.success(itemState.success);
    if (itemState.error) toast.error(itemState.error);
  }, [itemState.success, itemState.error]);

  return (
    <div className="space-y-6">
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>{t.admin.economyTitle}</CardTitle>
          <CardDescription>{t.admin.economyDesc}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <form action={settingAction} className="space-y-3 rounded-2xl border border-border/50 p-4">
            <input type="hidden" name="key" value="daily_reward_base" />
            <input type="hidden" name="kind" value="amount" />
            <Label>{t.admin.dailyBase}</Label>
            <Input
              name="amount"
              type="number"
              min="1"
              step="1"
              defaultValue={settings.dailyBase}
              className="min-h-11"
            />
            <Button type="submit" disabled={settingPending} className="min-h-11 w-full">
              {t.admin.saveSetting}
            </Button>
          </form>

          <form action={settingAction} className="space-y-3 rounded-2xl border border-border/50 p-4">
            <input type="hidden" name="key" value="daily_reward_streak_bonus" />
            <input type="hidden" name="kind" value="streak" />
            <Label>{t.admin.streakBonus}</Label>
            <Input
              name="amount"
              type="number"
              min="0"
              step="1"
              defaultValue={settings.streakBonus}
              className="min-h-11"
            />
            <Input
              name="max_streak"
              type="number"
              min="1"
              max="30"
              defaultValue={settings.maxStreak}
              className="min-h-11"
            />
            <Button type="submit" disabled={settingPending} className="min-h-11 w-full">
              {t.admin.saveSetting}
            </Button>
          </form>

          {(
            [
              ["shop_enabled", t.admin.shopEnabled, settings.shopEnabled],
              [
                "marketplace_enabled",
                t.admin.marketplaceEnabled,
                settings.marketplaceEnabled,
              ],
              [
                "stock_trading_enabled",
                t.admin.tradingEnabled,
                settings.tradingEnabled,
              ],
            ] as const
          ).map(([key, label, enabled]) => (
            <form
              key={key}
              action={settingAction}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border/50 p-4"
            >
              <input type="hidden" name="key" value={key} />
              <input type="hidden" name="kind" value="toggle" />
              <input type="hidden" name="enabled" value={enabled ? "false" : "true"} />
              <span className="text-sm font-medium">{label}</span>
              <Button type="submit" variant="outline" size="sm" disabled={settingPending}>
                {enabled ? t.admin.active : t.admin.inactive}
              </Button>
            </form>
          ))}
        </CardContent>
      </Card>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>{t.admin.createNews}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={newsAction} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t.admin.newsSlug}</Label>
              <Input name="slug" placeholder="chip-rally" className="min-h-11" required />
            </div>
            <div className="space-y-2">
              <Label>{t.admin.impact}</Label>
              <Input
                name="impact_percent"
                type="number"
                step="0.1"
                defaultValue="1.5"
                className="min-h-11"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t.admin.newsTitleEn}</Label>
              <Input name="title_en" className="min-h-11" required />
            </div>
            <div className="space-y-2">
              <Label>{t.admin.newsTitleTr}</Label>
              <Input name="title_tr" className="min-h-11" required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{t.admin.symbolsCsv}</Label>
              <Input
                name="symbols"
                placeholder="AAPL, NVDA, MSFT"
                className="min-h-11"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Sentiment</Label>
              <select
                name="sentiment"
                defaultValue="bullish"
                className="flex h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm"
              >
                <option value="bullish">bullish</option>
                <option value="bearish">bearish</option>
                <option value="neutral">neutral</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Body EN</Label>
              <Input name="body_en" className="min-h-11" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Body TR</Label>
              <Input name="body_tr" className="min-h-11" />
            </div>
            <Button
              type="submit"
              className="min-h-11 sm:col-span-2"
              disabled={newsPending}
            >
              {t.admin.publishNews}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>{t.admin.toggleItems}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.map((item) => (
            <form
              key={item.id}
              action={itemAction}
              className="flex flex-col gap-2 rounded-2xl border border-border/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <input type="hidden" name="item_id" value={item.id} />
              <input
                type="hidden"
                name="is_active"
                value={item.isActive ? "false" : "true"}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.category} · {formatCurrency(item.shopPrice)}
                </p>
              </div>
              <Button
                type="submit"
                size="sm"
                variant="outline"
                className="min-h-10"
                disabled={itemPending}
              >
                {item.isActive ? t.admin.active : t.admin.inactive}
              </Button>
            </form>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
