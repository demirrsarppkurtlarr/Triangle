import { LimitsForm } from "@/features/admin/components/limits-form";
import { getPlatformLimits } from "@/features/admin/services/admin.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function readAmount(value: unknown): number {
  if (
    value &&
    typeof value === "object" &&
    "amount" in value &&
    typeof (value as { amount: unknown }).amount === "number"
  ) {
    return (value as { amount: number }).amount;
  }
  return 0;
}

export default async function AdminLimitsPage() {
  const settings = await getPlatformLimits();

  const single = settings.find((s) => s.key === "transfer_single_limit");
  const daily = settings.find((s) => s.key === "transfer_daily_limit");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle>Transfer limits</CardTitle>
          <CardDescription>
            Updates the settings table. Enforced by transfer_funds RPC.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LimitsForm
            singleLimit={readAmount(single?.value) || 5000}
            dailyLimit={readAmount(daily?.value) || 10000}
          />
        </CardContent>
      </Card>

      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle>Current settings</CardTitle>
          <CardDescription>Read-only snapshot of platform config</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {settings.map((setting) => (
            <div
              key={setting.key}
              className="rounded-2xl border border-border/50 bg-secondary/40 px-4 py-3"
            >
              <p className="font-medium">{setting.key}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {setting.description}
              </p>
              <pre className="mt-2 overflow-x-auto text-xs text-muted-foreground">
                {JSON.stringify(setting.value, null, 2)}
              </pre>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
