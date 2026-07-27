import { z } from "zod";

export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters");

export const triangleIdSchema = z
  .string()
  .regex(
    /^TR-\d{4}-\d{4}-\d{4}$/,
    "Triangle ID must be in format TR-XXXX-XXXX-XXXX",
  );
