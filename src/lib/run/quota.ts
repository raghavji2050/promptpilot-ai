import { createHash } from "node:crypto";
import { fallbackSiteCap, supabaseService } from "./config";
import type { RunKind } from "./types";

type Env = Record<string, string | undefined>;
type Fetch = typeof fetch;

/** Today's date in IST (quota resets at 00:00 IST). */
export function istDay(now = new Date()): string {
  return new Date(now.getTime() + 5.5 * 3600_000).toISOString().slice(0, 10);
}

/** Hash of IP + a salt that rotates daily, so raw IPs are never stored and hashes can't be linked across days. */
export function hashIp(ip: string, day = istDay(), env: Env = process.env): string {
  const salt = createHash("sha256").update(`${env.RUN_IP_SALT || "promptpilot-run"}:${day}`).digest("hex");
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 40);
}

export interface QuotaResult { allowed: boolean; reason?: "QUOTA" | "SITE_CAP"; remaining: number; degraded: boolean }

// ---------- in-memory fallback (per server instance) ----------
const mem = new Map<string, number>();
function memKey(day: string, subject: string, kind: RunKind) { return `${day}|${subject}|${kind}`; }
export function resetMemoryQuota() { mem.clear(); }

function memConsume(day: string, subject: string, kind: RunKind, limit: number, siteCap: number, degraded: boolean): QuotaResult {
  if (mem.size > 50_000) for (const k of mem.keys()) if (!k.startsWith(day)) mem.delete(k);
  const sk = memKey(day, "__site__", kind);
  const uk = memKey(day, subject, kind);
  const site = mem.get(sk) ?? 0;
  const used = mem.get(uk) ?? 0;
  if (used >= limit) return { allowed: false, reason: "QUOTA", remaining: 0, degraded };
  if (site >= siteCap) return { allowed: false, reason: "SITE_CAP", remaining: Math.max(0, limit - used), degraded };
  mem.set(sk, site + 1);
  mem.set(uk, used + 1);
  return { allowed: true, remaining: limit - used - 1, degraded };
}
function memRelease(day: string, subject: string, kind: RunKind) {
  for (const k of [memKey(day, "__site__", kind), memKey(day, subject, kind)]) {
    const v = mem.get(k);
    if (v) mem.set(k, v - 1);
  }
}

/**
 * Atomically consume one run. Uses the Supabase RPC `consume_run_quota` (service role) when configured.
 * - DB not configured (dev/preview): in-memory counters with the normal limits.
 * - DB configured but failing: in-memory counters with a much smaller per-instance site cap (fail closed-ish).
 */
export async function consumeQuota(subject: string, kind: RunKind, limit: number, siteCap: number, opts: { env?: Env; fetch?: Fetch; now?: Date } = {}): Promise<QuotaResult> {
  const env = opts.env ?? process.env;
  const day = istDay(opts.now);
  if (limit <= 0) return { allowed: false, reason: "QUOTA", remaining: 0, degraded: false };
  const db = supabaseService(env);
  if (!db) return memConsume(day, subject, kind, limit, siteCap, false);
  try {
    const res = await (opts.fetch ?? fetch)(`${db.url}/rest/v1/rpc/consume_run_quota`, {
      method: "POST",
      headers: { apikey: db.serviceKey, Authorization: `Bearer ${db.serviceKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_day: day, p_subject: subject, p_kind: kind, p_limit: limit, p_site_cap: siteCap }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`rpc ${res.status}`);
    const j = await res.json();
    const row = Array.isArray(j) ? j[0] : j;
    if (!row || typeof row.allowed !== "boolean") throw new Error("bad rpc shape");
    return { allowed: row.allowed, reason: row.allowed ? undefined : row.reason === "SITE_CAP" ? "SITE_CAP" : "QUOTA", remaining: Math.max(0, Number(row.remaining) || 0), degraded: false };
  } catch {
    return memConsume(day, subject, kind, limit, Math.min(siteCap, fallbackSiteCap(env)), true);
  }
}

/** Give a run back when every provider failed (so users aren't charged for our outage). Best effort. */
export async function releaseQuota(subject: string, kind: RunKind, degraded: boolean, opts: { env?: Env; fetch?: Fetch; now?: Date } = {}): Promise<void> {
  const env = opts.env ?? process.env;
  const day = istDay(opts.now);
  const db = supabaseService(env);
  if (!db || degraded) return memRelease(day, subject, kind);
  try {
    await (opts.fetch ?? fetch)(`${db.url}/rest/v1/rpc/release_run_quota`, {
      method: "POST",
      headers: { apikey: db.serviceKey, Authorization: `Bearer ${db.serviceKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_day: day, p_subject: subject, p_kind: kind }),
      signal: AbortSignal.timeout(4000),
    });
  } catch { /* best effort */ }
}
