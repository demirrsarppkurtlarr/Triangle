import { TRIANGLE_ID_PATTERN } from "@/utils/constants";

export function isValidTriangleId(value: string): boolean {
  return TRIANGLE_ID_PATTERN.test(value.trim().toUpperCase());
}

export function normalizeTriangleId(value: string): string {
  return value.trim().toUpperCase();
}

export function formatTriangleIdDisplay(value: string): string {
  return normalizeTriangleId(value);
}

/** Formats raw digits into TR-XXXX-XXXX-XXXX while typing */
export function formatTriangleIdInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 12);
  if (digits.length === 0) return "";

  const parts = [
    digits.slice(0, 4),
    digits.slice(4, 8),
    digits.slice(8, 12),
  ].filter(Boolean);

  return `TR-${parts.join("-")}`;
}

export function maskTriangleId(value: string): string {
  const normalized = normalizeTriangleId(value);
  if (!isValidTriangleId(normalized)) return value;
  const parts = normalized.split("-");
  return `TR-••••-••••-${parts[3]}`;
}
