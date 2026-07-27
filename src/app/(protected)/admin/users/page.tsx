import { FreezeControls } from "@/features/admin/components/freeze-controls";
import { MintForm } from "@/features/admin/components/mint-form";
import { getAdminUsers } from "@/features/admin/services/admin.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatRelativeTime } from "@/utils/format";
import { cn } from "@/lib/utils";

export default async function AdminUsersPage() {
  const users = await getAdminUsers();

  return (
    <div className="space-y-6">
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle>All users</CardTitle>
          <CardDescription>
            Freeze, unfreeze, and inspect balances. Admin role is server-enforced.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No users found.
            </p>
          ) : (
            <>
              <ul className="space-y-3 md:hidden">
                {users.map((user) => (
                  <li
                    key={user.id}
                    className="rounded-2xl border border-border/50 bg-secondary/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">@{user.username}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {user.email}
                        </p>
                        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                          {user.triangle_id}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
                          user.is_frozen
                            ? "bg-destructive/10 text-destructive"
                            : "bg-success/10 text-success",
                        )}
                      >
                        {user.is_frozen ? "Frozen" : user.account_status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold tracking-tight">
                          {formatCurrency(user.balance)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Joined {formatRelativeTime(user.created_at)}
                        </p>
                      </div>
                      <FreezeControls
                        triangleId={user.triangle_id}
                        isFrozen={user.is_frozen}
                        isAdminUser={user.is_admin}
                      />
                    </div>
                  </li>
                ))}
              </ul>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-muted-foreground">
                      <th className="pb-3 font-medium">User</th>
                      <th className="pb-3 font-medium">Triangle ID</th>
                      <th className="pb-3 font-medium">Balance</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Joined</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-border/40 last:border-0"
                      >
                        <td className="py-3">
                          <p className="font-medium">@{user.username}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </td>
                        <td className="py-3 font-mono text-xs">
                          {user.triangle_id}
                        </td>
                        <td className="py-3 font-medium">
                          {formatCurrency(user.balance)}
                        </td>
                        <td className="py-3">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-xs font-medium",
                              user.is_frozen
                                ? "bg-destructive/10 text-destructive"
                                : "bg-success/10 text-success",
                            )}
                          >
                            {user.is_frozen ? "Frozen" : user.account_status}
                          </span>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {formatRelativeTime(user.created_at)}
                        </td>
                        <td className="py-3">
                          <FreezeControls
                            triangleId={user.triangle_id}
                            isFrozen={user.is_frozen}
                            isAdminUser={user.is_admin}
                          />
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

      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle>Mint to user</CardTitle>
          <CardDescription>
            Quick mint using a Triangle ID from the list above.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MintForm />
        </CardContent>
      </Card>
    </div>
  );
}
