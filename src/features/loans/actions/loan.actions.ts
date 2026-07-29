"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type LoanActionState = { error?: string; success?: string };

function revalidate() {
  revalidatePath("/loans");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
}

export async function takeLoanAction(
  _prev: LoanActionState,
  formData: FormData,
): Promise<LoanActionState> {
  const amount = Number(formData.get("amount"));
  const installments = Number(formData.get("installments") || 5);
  if (!amount || amount < 100) return { error: "Minimum $100" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("take_loan", {
    p_amount: amount,
    p_installments: installments,
  });
  if (error) return { error: error.message };
  revalidate();
  return { success: "Loan approved" };
}

export async function repayLoanAction(
  _prev: LoanActionState,
  formData: FormData,
): Promise<LoanActionState> {
  const loanId = formData.get("loan_id")?.toString();
  if (!loanId) return { error: "Missing loan" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("repay_loan", { p_loan_id: loanId });
  if (error) return { error: error.message };
  revalidate();
  return { success: "Payment made" };
}
