import {
  getAdminLogs,
  getAuditLogs,
} from "@/features/admin/services/admin.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatRelativeTime } from "@/utils/format";

export default async function AdminLogsPage() {
  const [adminLogs, auditLogs] = await Promise.all([
    getAdminLogs(),
    getAuditLogs(),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle>Admin logs</CardTitle>
          <CardDescription>Mint, freeze, and admin actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {adminLogs.length === 0 && (
            <p className="text-sm text-muted-foreground">No admin actions yet.</p>
          )}
          {adminLogs.map((log) => (
            <div
              key={log.id}
              className="rounded-2xl border border-border/50 bg-card/60 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium capitalize">
                  {log.action.replace(/_/g, " ")}
                </p>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(log.created_at)}
                </span>
              </div>
              <pre className="mt-2 overflow-x-auto text-xs text-muted-foreground">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle>Audit logs</CardTitle>
          <CardDescription>Security and transfer audit trail</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {auditLogs.length === 0 && (
            <p className="text-sm text-muted-foreground">No audit events yet.</p>
          )}
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="rounded-2xl border border-border/50 bg-card/60 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium capitalize">
                  {log.action.replace(/_/g, " ")}
                </p>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(log.created_at)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {log.resource_type}
                {log.resource_id ? ` · ${log.resource_id.slice(0, 8)}…` : ""}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
