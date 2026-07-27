import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { ThemeSettings } from "@/features/dashboard/components/theme-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <>
      <DashboardHeader
        title="Settings"
        description="Customize your TriangleBank experience"
      />
      <main className="mx-auto max-w-2xl space-y-6 page-pad py-6 md:py-8">
        <ThemeSettings />
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Simulation notice</CardTitle>
            <CardDescription>
              TriangleBank uses virtual money only. No real financial
              transactions occur on this platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Account limits, security policies, and admin controls are enforced
            server-side via Supabase RLS and stored procedures.
          </CardContent>
        </Card>
      </main>
    </>
  );
}
