import { timingSafeEqual } from "node:crypto";

/** Constant-time check of `Authorization: Bearer <HEALTH_TOKEN>`. False when HEALTH_TOKEN is unset. */
export function isAuthorized(header: string | null, token: string | undefined = process.env.HEALTH_TOKEN): boolean {
  const expected = token?.trim();
  if (!expected || !header) return false;
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!m?.[1]) return false;
  const a = Buffer.from(m[1].trim());
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    timingSafeEqual(b, b); // keep timing similar on length mismatch
    return false;
  }
  return timingSafeEqual(a, b);
}
