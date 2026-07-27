import { TriangleLogo } from "@/components/brand/triangle-logo";
import { TriangleIdBadge } from "@/components/brand/triangle-id-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type TriangleIdCardProps = {
  triangleId: string;
  username?: string;
  className?: string;
};

export function TriangleIdCard({
  triangleId,
  username,
  className,
}: TriangleIdCardProps) {
  return (
    <Card className={cn("glass-panel overflow-hidden border-border/50", className)}>
      <CardHeader className="pb-3">
        <div className="mb-2 flex items-center gap-3">
          <TriangleLogo size={28} />
          <CardDescription className="text-xs font-medium uppercase tracking-[0.18em]">
            Triangle ID
          </CardDescription>
        </div>
        <CardTitle className="sr-only">Your Triangle ID</CardTitle>
        <TriangleIdBadge triangleId={triangleId} size="lg" />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {username
            ? `Share this ID so others can send virtual money to @${username}.`
            : "Share this ID to receive virtual transfers. No real money is involved."}
        </p>
      </CardContent>
    </Card>
  );
}
