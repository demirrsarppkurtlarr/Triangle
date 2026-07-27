import { describe, expect, it } from "vitest";

import {
  formatTriangleIdInput,
  isValidTriangleId,
  maskTriangleId,
  normalizeTriangleId,
} from "@/utils/triangle-id";

describe("triangle-id utils", () => {
  it("validates canonical Triangle IDs", () => {
    expect(isValidTriangleId("TR-1234-5678-9012")).toBe(true);
    expect(isValidTriangleId("tr-1234-5678-9012")).toBe(true);
    expect(isValidTriangleId("TR-123-5678-9012")).toBe(false);
    expect(isValidTriangleId("XX-1234-5678-9012")).toBe(false);
  });

  it("normalizes casing and whitespace", () => {
    expect(normalizeTriangleId("  tr-1111-2222-3333  ")).toBe(
      "TR-1111-2222-3333",
    );
  });

  it("formats digits while typing", () => {
    expect(formatTriangleIdInput("123456789012")).toBe("TR-1234-5678-9012");
    expect(formatTriangleIdInput("12")).toBe("TR-12");
    expect(formatTriangleIdInput("12345")).toBe("TR-1234-5");
  });

  it("masks middle segments", () => {
    expect(maskTriangleId("TR-1234-5678-9012")).toBe("TR-••••-••••-9012");
  });
});
