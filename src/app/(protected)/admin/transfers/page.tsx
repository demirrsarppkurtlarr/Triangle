import Link from "next/link";

import { getAdminTransactions } from "@/features/admin/services/admin.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatRelativeTime } from "@/utils/format";
import { cn } from "@/lib/utils";

function statusClass(status: string) {
  return cn(
    "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
    status === "completed" && "bg-success/10 text-success",
    status === "failed" && "bg-destructive/10 text-destructive",
    status !== "completed" &&
      status !== "failed" &&
      "bg-secondary text-muted-foreground",
  );
}

export default async function AdminTransfersPage() {
  const transfers = await getAdminTransactions();

  return (
    <Card className="glass-panel border-border/50">
      <CardHeader>
        <CardTitle>All transfers</CardTitle>
        <CardDescription>
          Platform-wide transaction ledger (admin RLS).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {transfers.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No transactions yet.
          </p>
        ) : (
          <>
            <ul className="space-y-3 md:hidden">
              {transfers.map((tx) => (
                <li
                  key={tx.id}
                  className="rounded-2xl border border-border/50 bg-secondary/20 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/transfer/receipt/${tx.id}`}
                      className="min-w-0 font-mono text-xs text-primary hover:underline"
                    >
                      {tx.reference_id}
                    </Link>
                    <span className={statusClass(tx.status)}>{tx.status}</span>
                  </div>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-lg font-semibold tracking-tight">
                        {formatCurrency(tx.amount)}
                      </p>
                      <p className="capitalize text-xs text-muted-foreground">
                        {tx.type.replace("_", " ")}
                        {tx.initiator_username
                          ? ` · @${tx.initiator_username}`
                          : ""}
                      </p>
                      {tx.description && (
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {tx.description}
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 text-xs text-muted-foreground">
                      {formatRelativeTime(tx.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground">
                    <th className="pb-3 font-medium">Reference</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Initiator</th>
                    <th className="pb-3 font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-border/40 last:border-0"
                    >
                      <td className="py-3">
                        <Link
                          href={`/transfer/receipt/${tx.id}`}
                          className="font-mono text-xs text-primary hover:underline"
                        >
                          {tx.reference_id}
                        </Link>
                        {tx.description && (
                          <p className="mt-1 max-w-[200px] truncate text-xs text-muted-foreground">
                            {tx.description}
                          </p>
                        )}
                      </td>
                      <td className="py-3 capitalize">
                        {tx.type.replace("_", " ")}
                      </td>
                      <td className="py-3 font-medium">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3">
                        <span className={statusClass(tx.status)}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3">
                        {tx.initiator_username
                          ? `@${tx.initiator_username}`
                          : "—"}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {formatRelativeTime(tx.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
