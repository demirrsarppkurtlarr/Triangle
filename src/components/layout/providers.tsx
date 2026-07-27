"use client";

import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";

import { QueryProvider } from "@/lib/query/client";
import { ThemeProvider } from "@/components/layout/theme-provider";

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <MotionConfig reducedMotion="user">
        <QueryProvider>
          {children}
          <Toaster richColors position="top-center" />
        </QueryProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
