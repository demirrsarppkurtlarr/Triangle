import { signOutAction } from "@/features/auth/actions/auth.actions";
import { Button } from "@/components/ui/button";

type DashboardHeaderProps = {
  title: string;
  description?: string;
  username?: string;
};

export function DashboardHeader({
  title,
  description,
  username,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-card/70 backdrop-blur-xl supports-[backdrop-filter]:bg-card/50">
      <div className="page-pad mx-auto flex max-w-6xl items-start justify-between gap-3 py-4 md:items-center md:py-5">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold tracking-tight md:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground md:line-clamp-none">
              {description}
            </p>
          )}
          {username && (
            <p className="mt-1 text-xs text-muted-foreground">@{username}</p>
          )}
        </div>
        <form action={signOutAction} className="hidden shrink-0 md:block">
          <Button variant="outline" size="sm" type="submit">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
