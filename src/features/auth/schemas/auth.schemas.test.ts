import { describe, expect, it } from "vitest";

import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  usernameSchema,
} from "@/features/auth/schemas/auth.schemas";
import { emailSchema, passwordSchema, triangleIdSchema } from "@/schemas";

describe("shared schemas", () => {
  it("accepts a valid email", () => {
    expect(emailSchema.safeParse("user@triangle.bank").success).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
  });

  it("enforces password length", () => {
    expect(passwordSchema.safeParse("short").success).toBe(false);
    expect(passwordSchema.safeParse("longenough").success).toBe(true);
  });

  it("validates Triangle ID format", () => {
    expect(triangleIdSchema.safeParse("TR-4938-2910-9918").success).toBe(true);
    expect(triangleIdSchema.safeParse("TR-4938-2910").success).toBe(false);
  });
});

describe("auth schemas", () => {
  it("parses a valid login payload", () => {
    const result = loginSchema.safeParse({
      email: "a@b.com",
      password: "password1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid usernames", () => {
    expect(usernameSchema.safeParse("ab").success).toBe(false);
    expect(usernameSchema.safeParse("bad name").success).toBe(false);
    expect(usernameSchema.safeParse("demirsarpk").success).toBe(true);
  });

  it("requires matching passwords on register", () => {
    const mismatch = registerSchema.safeParse({
      username: "alice",
      email: "a@b.com",
      password: "password1",
      confirmPassword: "password2",
    });
    expect(mismatch.success).toBe(false);

    const match = registerSchema.safeParse({
      username: "alice",
      email: "a@b.com",
      password: "password1",
      confirmPassword: "password1",
    });
    expect(match.success).toBe(true);
  });

  it("validates forgot / reset password flows", () => {
    expect(
      forgotPasswordSchema.safeParse({ email: "a@b.com" }).success,
    ).toBe(true);

    expect(
      resetPasswordSchema.safeParse({
        password: "password1",
        confirmPassword: "password1",
      }).success,
    ).toBe(true);

    expect(
      resetPasswordSchema.safeParse({
        password: "password1",
        confirmPassword: "nope",
      }).success,
    ).toBe(false);
  });
});
