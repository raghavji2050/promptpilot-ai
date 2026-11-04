import { rateLimit } from "@/lib/llm/ratelimit";
import { hashIp, istDay } from "@/lib/run/quota";
import { supabaseService } from "@/lib/run/config";

type Env = Record<string, string | undefined>;
type Fetch = typeof fetch;

export type LimitScope = "enhance" | "card" | "run";

/** Burst window (in-memory, per instance) + optional daily cap (Supabase `run_quota`, shared across instances). */
export interface LimitRule { limit: number; windowMs: number; daily?: number; siteDaily?: number }

function num(env: Env, name: string, def: number): number {
  const v = Number(env[name]);
  return env[name] !== undefined && Number.isFinite(v) && v > 0 ? Math.floor(v) : def;
}

export function limitRules(env: Env = process.env): Record<LimitScope, LimitRule> {
  return {
    enhance: { limit: num(env, "RL_ENHANCE_PER_MIN", 10), windowMs: 60_000, daily: num(env, "RL_ENHANCE_PER_DAY", 200), siteDaily: num(env, "RL_ENHANCE_SITE_PER_DAY", 5000) },
    card: { limit: num(env, "RL_CARD_PER_MIN", 30), windowMs: 60_000, daily: num(env, "RL_CARD_PER_DAY", 1000), siteDaily: num(env, "RL_CARD_SITE_PER_DAY", 50000) },
    // /api/run has its own daily quota (lib/run/quota.ts); only the burst window lives here.
    run: { limit: num(env, "RL_RUN_PER_MIN", 6), windowMs: 60_000 },
  };
}

/** Client IP as set by Vercel's edge (x-real-ip), falling back to the first x-forwarded-for hop. */
export function clientIp(headers: Headers): string {
  return headers.get("x-real-ip")?.trim() || headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export interface LimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  retryAfter: number; // seconds, 0 when ok
  store: "memory" | "supabase";
  reason?: "BURST" | "DAILY" | "SITE_CAP";
}

// When the quota table/RPC is missing (run-quota.sql not applied) or Supabase is down, skip the DB for a while
// so every request doesn't pay a failing round-trip. Exported for tests.
let dbSkipUntil = 0;
export function resetLimiterState() { dbSkipUntil = 0; }
const DB_BACKOFF_MS = 10 * 60_000;

function secondsToIstMidnight(now: Date): number {
  const ist = now.getTime() + 5.5 * 3600_000;
  const next = (Math.floor(ist / 86_400_000) + 1) * 86_400_000;
  return Math.max(1, Math.ceil((next - ist) / 1000));
}

/**
 * Check + consume one request for `scope` from `ip`.
 * 1. In-memory fixed window (always). 2. If a service role is configured and the rule has a daily cap,
 * the Supabase RPC `consume_run_quota` (run-quota.sql). Any DB problem degrades to in-memory only — never throws.
 */
export async function checkLimit(scope: LimitScope, ip: string, opts: { env?: Env; fetch?: Fetch; now?: Date } = {}): Promise<LimitResult> {
  const env = opts.env ?? process.env;
  const now = opts.now ?? new Date();
  const rule = limitRules(env)[scope];
  const burst = rateLimit(`${scope}:${ip}`, rule.limit, rule.windowMs, now.getTime());
  if (!burst.ok) return { ok: false, limit: rule.limit, remaining: 0, retryAfter: Math.max(1, burst.retryAfter), store: "memory", reason: "BURST" };
  const memOk: LimitResult = { ok: true, limit: rule.limit, remaining: burst.remaining, retryAfter: 0, store: "memory" };

  const db = supabaseService(env);
  if (!db || !rule.daily || now.getTime() < dbSkipUntil) return memOk;
  const day = istDay(now);
  try {
    const res = await (opts.fetch ?? fetch)(`${db.url}/rest/v1/rpc/consume_run_quota`, {
      method: "POST",
      headers: { apikey: db.serviceKey, Authorization: `Bearer ${db.serviceKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_day: day, p_subject: `ip:${hashIp(ip, day, env)}`, p_kind: scope, p_limit: rule.daily, p_site_cap: rule.siteDaily ?? rule.daily * 100 }),
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) throw new Error(`rpc ${res.status}`);
    const j: unknown = await res.json();
    const row = (Array.isArray(j) ? j[0] : j) as { allowed?: unknown; reason?: unknown; remaining?: unknown } | undefined;
    if (!row || typeof row.allowed !== "boolean") throw new Error("bad rpc shape");
    if (row.allowed) return { ...memOk, store: "supabase", remaining: Math.min(burst.remaining, Math.max(0, Number(row.remaining) || 0)) };
    return { ok: false, limit: rule.daily, remaining: 0, retryAfter: secondsToIstMidnight(now), store: "supabase", reason: row.reason === "SITE_CAP" ? "SITE_CAP" : "DAILY" };
  } catch (e) {
    dbSkipUntil = now.getTime() + DB_BACKOFF_MS;
    // No secrets here: only the failure reason (e.g. "rpc 404", timeout) so Vercel logs show why the shared cap was skipped.
    console.warn(JSON.stringify({ level: "warn", msg: "ratelimit_db_fallback", scope, reason: e instanceof Error ? e.message.slice(0, 120) : "unknown" }));
    return memOk;
  }
}

/** Standard headers for limited responses (and informational ones for allowed responses). */
export function limitHeaders(r: LimitResult): Record<string, string> {
  const h: Record<string, string> = { "X-RateLimit-Limit": String(r.limit), "X-RateLimit-Remaining": String(r.remaining), "X-RateLimit-Store": r.store };
  if (!r.ok) h["Retry-After"] = String(r.retryAfter);
  return h;
}

export function tooManyMessage(r: LimitResult): string {
  if (r.reason === "BURST") return `Too many requests. Try again in ${r.retryAfter}s.`;
  return "Daily limit reached. Try again tomorrow.";
}
