"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatTriangleIdDisplay } from "@/utils/triangle-id";

type TriangleIdBadgeProps = {
  triangleId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  showCopy?: boolean;
};

export function TriangleIdBadge({
  triangleId,
  className,
  size = "md",
  showCopy = true,
}: TriangleIdBadgeProps) {
  const [copied, setCopied] = useState(false);
  const display = formatTriangleIdDisplay(triangleId);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(display);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable in some environments
    }
  }

  const sizeClasses = {
    sm: "text-sm tracking-wide",
    md: "text-xl tracking-wider md:text-2xl",
    lg: "text-2xl tracking-wider md:text-3xl",
  };

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "font-mono font-semibold text-foreground",
          sizeClasses[size],
        )}
      >
        {display}
      </span>
      {showCopy && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy Triangle ID"}
        >
          {copied ? (
            <Check className="size-4 text-success" />
          ) : (
            <Copy className="size-4" />
          )}
        </Button>
      )}
    </div>
  );
}
