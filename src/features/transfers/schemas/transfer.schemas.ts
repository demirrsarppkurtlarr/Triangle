import { z } from "zod";

import { triangleIdSchema } from "@/schemas";

export function createTransferSchema(singleLimit = 5000) {
  return z.object({
    to_triangle_id: triangleIdSchema,
    amount: z.coerce
      .number({ invalid_type_error: "Enter a valid amount" })
      .positive("Amount must be greater than zero")
      .max(singleLimit, `Maximum single transfer is $${singleLimit.toLocaleString()}`),
    description: z
      .string()
      .max(200, "Description is too long")
      .optional()
      .transform((v) => v?.trim() || undefined),
    idempotency_key: z.string().uuid().optional(),
  });
}

export type TransferInput = z.infer<ReturnType<typeof createTransferSchema>>;

export type TransferLimits = {
  singleLimit: number;
  dailyLimit: number;
};

export type TransferResult = {
  success: boolean;
  transaction_id?: string;
  reference_id?: string;
  duplicate?: boolean;
};

export type TransferReceipt = {
  id: string;
  reference_id: string;
  type: string;
  status: string;
  amount: number;
  fee: number;
  description: string | null;
  created_at: string;
  completed_at: string | null;
  direction: "in" | "out";
  counterparty: {
    triangle_id: string;
    username: string;
    full_name: string | null;
  } | null;
  sender: {
    triangle_id: string;
    username: string;
  };
};
