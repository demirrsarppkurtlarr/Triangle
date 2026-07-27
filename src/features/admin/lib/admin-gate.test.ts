import { describe, expect, it } from "vitest";

import { canAccessAdmin } from "@/features/admin/lib/admin-gate";
import { ADMIN_USERNAME } from "@/utils/constants";

describe("canAccessAdmin", () => {
  it("allows only demirsarpk with is_admin and not frozen", () => {
    expect(
      canAccessAdmin({
        username: ADMIN_USERNAME,
        is_admin: true,
        is_frozen: false,
      }),
    ).toBe(true);
  });

  it("denies wrong username even if is_admin", () => {
    expect(
      canAccessAdmin({
        username: "hacker",
        is_admin: true,
        is_frozen: false,
      }),
    ).toBe(false);
  });

  it("denies admin username without is_admin flag", () => {
    expect(
      canAccessAdmin({
        username: ADMIN_USERNAME,
        is_admin: false,
        is_frozen: false,
      }),
    ).toBe(false);
  });

  it("denies frozen admin", () => {
    expect(
      canAccessAdmin({
        username: ADMIN_USERNAME,
        is_admin: true,
        is_frozen: true,
      }),
    ).toBe(false);
  });

  it("denies null / undefined profiles", () => {
    expect(canAccessAdmin(null)).toBe(false);
    expect(canAccessAdmin(undefined)).toBe(false);
  });
});
