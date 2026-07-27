import { describe, expect, it } from "vitest";

import { formatCurrency, formatDateTime, formatRelativeTime } from "@/utils/format";

describe("formatCurrency", () => {
  it("formats USD with two decimals", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats negative amounts", () => {
    expect(formatCurrency(-42.1)).toBe("-$42.10");
  });
});

describe("formatRelativeTime", () => {
  it("describes a recent past timestamp", () => {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    expect(formatRelativeTime(twoMinutesAgo)).toMatch(/minute/);
  });

  it("describes a future timestamp", () => {
    const inOneHour = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(inOneHour)).toMatch(/hour/);
  });
});

describe("formatDateTime", () => {
  it("returns a short readable datetime", () => {
    const formatted = formatDateTime("2026-01-15T14:30:00.000Z");
    expect(formatted).toMatch(/Jan/);
    expect(formatted).toMatch(/15/);
  });
});
