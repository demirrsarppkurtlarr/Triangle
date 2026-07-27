import { describe, expect, it } from "vitest";

import { tradeSchema } from "@/features/stocks/schemas/trade.schemas";

describe("tradeSchema", () => {
  it("uppercases symbols and coerces quantity", () => {
    const result = tradeSchema.safeParse({
      symbol: " aapl ",
      quantity: "2.5",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.symbol).toBe("AAPL");
      expect(result.data.quantity).toBe(2.5);
    }
  });

  it("rejects non-positive quantity", () => {
    expect(
      tradeSchema.safeParse({ symbol: "AAPL", quantity: 0 }).success,
    ).toBe(false);
  });

  it("rejects quantity above 10000", () => {
    expect(
      tradeSchema.safeParse({ symbol: "AAPL", quantity: 10001 }).success,
    ).toBe(false);
  });
});
