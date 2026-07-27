"use client";

import { useActionState, useEffect } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  updatePreferencesAction,
  type SettingsActionState,
} from "@/features/settings/actions/settings.actions";
import type { UserPreferences } from "@/features/settings/services/settings.service";
import { useI18n } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

const initial: SettingsActionState = {};

type SettingsPanelsProps = {
  preferences: UserPreferences;
};

export function SettingsPanels({ preferences }: SettingsPanelsProps) {
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const [state, action, pending] = useActionState(
    updatePreferencesAction,
    initial,
  );

  useEffect(() => {
    if (state.success) toast.success(t.settings.saved);
    if (state.error) toast.error(state.error);
  }, [state.success, state.error, t.settings.saved]);

  const themes = [
    { value: "light", label: t.settings.light, icon: Sun },
    { value: "dark", label: t.settings.dark, icon: Moon },
    { value: "system", label: t.settings.system, icon: Monitor },
  ] as const;

  function onLocale(next: Locale) {
    setLocale(next);
  }

  return (
    <div className="space-y-6">
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>{t.settings.appearance}</CardTitle>
          <CardDescription>{t.settings.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {themes.map((item) => {
              const active = theme === item.value;
              return (
                <Button
                  key={item.value}
                  type="button"
                  variant={active ? "default" : "outline"}
                  className="h-auto min-h-16 flex-col gap-2 rounded-2xl py-4"
                  onClick={() => setTheme(item.value)}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>{t.settings.language}</CardTitle>
          <CardDescription>{t.settings.languageHint}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {(["tr", "en"] as const).map((code) => (
              <Button
                key={code}
                type="button"
                variant={locale === code ? "default" : "outline"}
                className="min-h-12 rounded-2xl"
                onClick={() => onLocale(code)}
              >
                {code === "tr" ? t.settings.turkish : t.settings.english}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>{t.settings.notifications}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <input type="hidden" name="locale" value={locale} />
            <Toggle
              name="email_notifications"
              label={t.settings.emailNotifs}
              defaultChecked={preferences.emailNotifications}
            />
            <Toggle
              name="transfer_notifications"
              label={t.settings.transferNotifs}
              defaultChecked={preferences.transferNotifications}
            />
            <Toggle
              name="market_notifications"
              label={t.settings.marketNotifs}
              defaultChecked={preferences.marketNotifications}
            />
            <Button type="submit" className="min-h-11 w-full sm:w-auto" disabled={pending}>
              {pending ? t.common.loading : t.common.save}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>{t.settings.simulation}</CardTitle>
          <CardDescription>{t.settings.simulationBody}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

function Toggle({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label
      className={cn(
        "flex min-h-12 cursor-pointer items-center justify-between gap-4 rounded-2xl border border-border/60 bg-secondary/40 px-4 py-3",
      )}
    >
      <span className="text-sm font-medium">{label}</span>
      <input
        type="checkbox"
        name={name}
        value="true"
        defaultChecked={defaultChecked}
        className="size-5 accent-[var(--primary)]"
      />
    </label>
  );
}
