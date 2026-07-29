"use client";

import { useActionState, useEffect } from "react";
import { Check, Palette, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { MotionButton } from "@/components/motion/motion-button";
import {
  buyThemeAction,
  type ThemeActionState,
} from "@/features/themes/actions/theme.actions";
import type { CustomTheme } from "@/features/themes/services/theme.service";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";

const initial: ThemeActionState = {};

type Props = {
  themes: CustomTheme[];
  activeTheme: string;
  cash: number;
  locale: string;
};

export function ThemesHub({ themes, activeTheme, cash, locale }: Props) {
  const [state, action, pending] = useActionState(buyThemeAction, initial);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) toast.success(state.success);
  }, [state]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Bakiye: <span className="font-semibold text-foreground">{formatCurrency(cash)}</span>
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((theme) => {
          const isActive = activeTheme === theme.id;
          const desc = locale === "tr" ? theme.descriptionTr : theme.descriptionEn;
          const primaryVar = theme.cssVars["--primary"];
          const bgColor = primaryVar
            ? `hsl(${primaryVar})`
            : undefined;

          return (
            <div
              key={theme.id}
              className={cn(
                "rounded-[1.35rem] border bg-card/80 p-4 shadow-soft transition-all",
                isActive ? "border-primary/40 ring-2 ring-primary/20" : "border-border/50",
              )}
            >
              <div className="mb-3 flex items-center gap-3">
                <div
                  className="flex size-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: bgColor ?? "var(--primary)" }}
                >
                  <Palette className="size-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{theme.name}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>

              {Object.keys(theme.cssVars).length > 0 && (
                <div className="mb-3 flex gap-1.5">
                  {Object.entries(theme.cssVars).slice(0, 4).map(([key, val]) => (
                    <div
                      key={key}
                      className="size-6 rounded-full border border-border/40"
                      style={{ backgroundColor: `hsl(${val})` }}
                      title={key}
                    />
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {theme.isFree ? "Ücretsiz" : theme.owned ? "Sahipsin" : formatCurrency(theme.price)}
                </span>
                <form action={action}>
                  <input type="hidden" name="theme_id" value={theme.id} />
                  <MotionButton
                    type="submit"
                    size="sm"
                    variant={isActive ? "secondary" : theme.owned ? "outline" : "default"}
                    className="min-h-9 gap-1.5"
                    pending={pending}
                    pendingLabel="…"
                    disabled={isActive}
                  >
                    {isActive ? (
                      <>
                        <Check className="size-3.5" /> Aktif
                      </>
                    ) : theme.owned ? (
                      "Etkinleştir"
                    ) : (
                      <>
                        <ShoppingBag className="size-3.5" /> Satın al
                      </>
                    )}
                  </MotionButton>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
