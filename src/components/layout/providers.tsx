"use client";

import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";

import { QueryProvider } from "@/lib/query/client";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { I18nProvider } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/dictionaries";

type ProvidersProps = {
  children: React.ReactNode;
  initialLocale?: Locale;
};

export function Providers({
  children,
  initialLocale = "tr",
}: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <I18nProvider initialLocale={initialLocale}>
        <MotionConfig reducedMotion="user">
          <QueryProvider>
            {children}
            <Toaster richColors position="top-center" />
          </QueryProvider>
        </MotionConfig>
      </I18nProvider>
    </ThemeProvider>
  );
}
