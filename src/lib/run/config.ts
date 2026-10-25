import type { RunKind, RunTier } from "./types";

type Env = Record<string, string | undefined>;

function num(env: Env, name: string, def: number): number {
  const v = Number(env[name]);
  return Number.isFinite(v) && v >= 0 ? Math.floor(v) : def;
}

/** Per-tier daily limits. "pro" exists so paid plans can raise limits later; nothing sells it yet. */
export function tierLimits(tier: RunTier, env: Env = process.env): Record<RunKind, number> {
  if (tier === "pro") return { text: num(env, "RUN_PRO_TEXT_PER_DAY", 50), image: num(env, "RUN_PRO_IMAGE_PER_DAY", 10) };
  if (tier === "free") return { text: num(env, "RUN_USER_TEXT_PER_DAY", 10), image: num(env, "RUN_USER_IMAGE_PER_DAY", 2) };
  return { text: num(env, "RUN_ANON_TEXT_PER_DAY", 5), image: num(env, "RUN_ANON_IMAGE_PER_DAY", 1) };
}

/** Site-wide daily caps, kept below the providers' free limits. */
export function siteCaps(env: Env = process.env): Record<RunKind, number> {
  return { text: num(env, "RUN_SITE_TEXT_PER_DAY", 250), image: num(env, "RUN_SITE_IMAGE_PER_DAY", 100) };
}

/** Per-instance site cap used when the quota database is configured but unreachable. */
export function fallbackSiteCap(env: Env = process.env): number {
  return num(env, "RUN_FALLBACK_SITE_CAP", 30);
}

export function maxTokens(env: Env = process.env): number {
  return Math.min(num(env, "RUN_MAX_TOKENS", 1024), 4096);
}

export function turnstileSecret(env: Env = process.env): string | null {
  return env.TURNSTILE_SECRET_KEY?.trim() || null;
}
export function turnstileSiteKey(env: Env = process.env): string | null {
  return env.TURNSTILE_SITE_KEY?.trim() || env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || null;
}

export function supabaseService(env: Env = process.env): { url: string; serviceKey: string; anonKey: string | null } | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return url && serviceKey ? { url: url.replace(/\/$/, ""), serviceKey, anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || null } : null;
}
