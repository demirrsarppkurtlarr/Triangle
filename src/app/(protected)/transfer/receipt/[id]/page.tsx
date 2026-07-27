import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { TransferReceiptCard } from "@/features/transfers/components/transfer-receipt";
import { getTransferReceipt } from "@/features/transfers/services/transfer.service";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

type ReceiptPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TransferReceiptPage({ params }: ReceiptPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const receipt = await getTransferReceipt(id, user.id);

  if (!receipt) notFound();

  return (
    <>
      <DashboardHeader
        title="Transfer receipt"
        description="Virtual transaction confirmation"
      />
      <main className="mx-auto max-w-lg space-y-4 page-pad py-6 md:py-8">
        <TransferReceiptCard receipt={receipt} />
        <Button asChild variant="ghost" className="w-full">
          <Link href="/transactions">View all activity</Link>
        </Button>
      </main>
    </>
  );
}
