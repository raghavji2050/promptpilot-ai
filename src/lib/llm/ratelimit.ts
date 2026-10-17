/**
 * Fixed-window in-memory rate limiter. Per server instance only. On Cloudflare Workers
 * or multi-instance hosting, replace with the Workers rate-limit binding or a shared store.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): { ok: boolean; retryAfter: number; remaining: number } {
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10000) for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    return { ok: true, retryAfter: 0, remaining: limit - 1 };
  }
  if (b.count >= limit) return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000), remaining: 0 };
  b.count++;
  return { ok: true, retryAfter: 0, remaining: limit - b.count };
}
