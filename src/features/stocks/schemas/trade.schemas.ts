import { z } from "zod";

export const tradeSchema = z.object({
  symbol: z
    .string()
    .trim()
    .min(1, "Symbol is required")
    .max(12)
    .transform((s) => s.toUpperCase()),
  quantity: z.coerce.number().positive("Quantity must be positive").max(10000),
});

export type TradeInput = z.infer<typeof tradeSchema>;
