"use client";

import { Loader2, Search, User } from "lucide-react";
import { useDeferredValue, useEffect, useState, useTransition } from "react";

import { Input } from "@/components/ui/input";
import { searchUsersByQuery } from "@/features/triangle-id/actions/search.actions";
import type { UserSearchResult } from "@/features/triangle-id/types";
import { cn } from "@/lib/utils";

export type { UserSearchResult };

type TriangleIdSearchProps = {
  onSelect?: (user: UserSearchResult) => void;
  className?: string;
  placeholder?: string;
};

export function TriangleIdSearch({
  onSelect,
  className,
  placeholder = "Search by Triangle ID or username",
}: TriangleIdSearchProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (deferredQuery.length < 2) {
      return;
    }

    const timer = window.setTimeout(() => {
      startTransition(async () => {
        const response = await searchUsersByQuery(deferredQuery);
        if (response.success) {
          setResults(response.data);
          setError(null);
        } else {
          setResults([]);
          setError(response.error);
        }
      });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [deferredQuery]);

  const showEmpty =
    !isPending &&
    deferredQuery.length >= 2 &&
    results.length === 0 &&
    !error;

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => {
            const next = event.target.value;
            setQuery(next);
            if (next.trim().length < 2) {
              setResults([]);
              setError(null);
            }
          }}
          placeholder={placeholder}
          className="pl-11 pr-11"
          autoComplete="off"
          spellCheck={false}
        />
        {isPending && (
          <Loader2 className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      {results.length > 0 && deferredQuery.length >= 2 && (
        <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-soft backdrop-blur-xl">
          {results.map((user) => (
            <li key={user.triangle_id}>
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/80"
                onClick={() => {
                  onSelect?.(user);
                  setQuery(user.triangle_id);
                  setResults([]);
                }}
              >
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <User className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    @{user.username}
                    {user.full_name ? (
                      <span className="ml-2 font-normal text-muted-foreground">
                        {user.full_name}
                      </span>
                    ) : null}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {user.triangle_id}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {showEmpty && (
        <p className="mt-2 text-sm text-muted-foreground">No users found.</p>
      )}
    </div>
  );
}
