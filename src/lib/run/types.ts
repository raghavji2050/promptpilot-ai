/** Shared, client-safe types for the free "Run" feature. No env access here. */
export type RunKind = "text" | "image";
export type RunTier = "anon" | "free" | "pro";

export interface RunConfig {
  available: { text: boolean; image: boolean };
  turnstileSiteKey: string | null;
  /** Daily limit for the caller's tier. */
  limits: { text: number; image: number };
  tier: RunTier;
  /** Provider names that may receive prompts (for the privacy note). */
  providers: string[];
}

export type RunResponse =
  | { ok: true; kind: RunKind; text?: string; image?: string; provider: string; model: string; label: string; remaining: number | null; tier: RunTier; degraded?: boolean }
  | { ok: false; code: RunErrorCode; message: string };

export type RunErrorCode = "VALIDATION" | "FORBIDDEN" | "TURNSTILE" | "QUOTA" | "SITE_CAP" | "UNAVAILABLE" | "PROVIDER" | "RATE_LIMITED";
