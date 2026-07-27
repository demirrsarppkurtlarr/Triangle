import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, CheckCircle2 } from "lucide-react";

import { TriangleIdBadge } from "@/components/brand/triangle-id-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TransferReceipt } from "@/features/transfers/schemas/transfer.schemas";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { cn } from "@/lib/utils";

type TransferReceiptCardProps = {
  receipt: TransferReceipt;
};

export function TransferReceiptCard({ receipt }: TransferReceiptCardProps) {
  const isOutgoing = receipt.direction === "out";
  const isCompleted = receipt.status === "completed";

  return (
    <Card className="glass-panel overflow-hidden border-border/50">
      <div
        className={cn(
          "px-6 py-8 text-center",
          isCompleted
            ? "bg-gradient-to-br from-success/10 to-primary/5"
            : "bg-secondary/50",
        )}
      >
        <div
          className={cn(
            "mx-auto mb-4 flex size-16 items-center justify-center rounded-full",
            isCompleted ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
          )}
        >
          {isCompleted ? (
            <CheckCircle2 className="size-8" />
          ) : isOutgoing ? (
            <ArrowUpRight className="size-8" />
          ) : (
            <ArrowDownLeft className="size-8" />
          )}
        </div>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {isOutgoing ? "Transfer sent" : "Money received"}
        </p>
        <p className="mt-2 text-4xl font-semibold tracking-tight">
          {isOutgoing ? "−" : "+"}
          {formatCurrency(receipt.amount)}
        </p>
        <p className="mt-2 capitalize text-sm text-muted-foreground">
          Status: {receipt.status}
        </p>
      </div>

      <CardHeader>
        <CardTitle>Receipt</CardTitle>
        <CardDescription>{receipt.reference_id}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 text-sm">
        <div className="flex justify-between gap-4 border-b border-border/50 pb-3">
          <span className="text-muted-foreground">Date</span>
          <span className="font-medium">
            {formatDateTime(receipt.completed_at ?? receipt.created_at)}
          </span>
        </div>

        {receipt.counterparty && (
          <div className="flex justify-between gap-4 border-b border-border/50 pb-3">
            <span className="text-muted-foreground">
              {isOutgoing ? "To" : "From"}
            </span>
            <div className="text-right">
              <p className="font-medium">@{receipt.counterparty.username}</p>
              <TriangleIdBadge
                triangleId={receipt.counterparty.triangle_id}
                size="sm"
                showCopy={false}
              />
            </div>
          </div>
        )}

        <div className="flex justify-between gap-4 border-b border-border/50 pb-3">
          <span className="text-muted-foreground">Initiated by</span>
          <span className="font-medium">@{receipt.sender.username}</span>
        </div>

        <div className="flex justify-between gap-4 border-b border-border/50 pb-3">
          <span className="text-muted-foreground">Fee</span>
          <span className="font-medium">{formatCurrency(receipt.fee)}</span>
        </div>

        {receipt.description && (
          <div className="flex justify-between gap-4 border-b border-border/50 pb-3">
            <span className="text-muted-foreground">Note</span>
            <span className="max-w-[60%] text-right font-medium">
              {receipt.description}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
          <Button asChild className="flex-1">
            <Link href="/transfer">Send again</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
