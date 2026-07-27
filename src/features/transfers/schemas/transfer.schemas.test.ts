import { describe, expect, it } from "vitest";

import { createTransferSchema } from "@/features/transfers/schemas/transfer.schemas";

describe("createTransferSchema", () => {
  const schema = createTransferSchema(5000);

  it("accepts a valid transfer", () => {
    const result = schema.safeParse({
      to_triangle_id: "TR-1234-5678-9012",
      amount: "125.50",
      description: " lunch ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(125.5);
      expect(result.data.description).toBe("lunch");
    }
  });

  it("rejects zero / negative amounts", () => {
    expect(
      schema.safeParse({
        to_triangle_id: "TR-1234-5678-9012",
        amount: 0,
      }).success,
    ).toBe(false);
  });

  it("enforces the single-transfer limit", () => {
    const result = schema.safeParse({
      to_triangle_id: "TR-1234-5678-9012",
      amount: 5000.01,
    });
    expect(result.success).toBe(false);
  });

  it("rejects malformed Triangle IDs", () => {
    expect(
      schema.safeParse({
        to_triangle_id: "not-an-id",
        amount: 10,
      }).success,
    ).toBe(false);
  });
});
