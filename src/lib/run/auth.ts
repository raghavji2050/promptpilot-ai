import { supabaseService } from "./config";
import type { RunTier } from "./types";

type Env = Record<string, string | undefined>;

/** Resolve the caller from a Supabase access token. Anonymous on any failure. */
export async function resolveCaller(authHeader: string | null, opts: { env?: Env; fetch?: typeof fetch } = {}): Promise<{ userId: string | null; tier: RunTier }> {
  const env = opts.env ?? process.env;
  const f = opts.fetch ?? fetch;
  const token = authHeader?.match(/^Bearer\s+(\S{20,4096})$/)?.[1];
  const db = supabaseService(env);
  if (!token || !db?.anonKey) return { userId: null, tier: "anon" };
  try {
    const u = await f(`${db.url}/auth/v1/user`, { headers: { apikey: db.anonKey, Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(4000) });
    if (!u.ok) return { userId: null, tier: "anon" };
    const user = await u.json();
    const id = typeof user?.id === "string" && /^[0-9a-f-]{36}$/i.test(user.id) ? user.id : null;
    if (!id) return { userId: null, tier: "anon" };
    let tier: RunTier = "free";
    try {
      const p = await f(`${db.url}/rest/v1/profiles?id=eq.${id}&select=plan`, { headers: { apikey: db.serviceKey, Authorization: `Bearer ${db.serviceKey}` }, signal: AbortSignal.timeout(4000) });
      const rows = p.ok ? await p.json() : [];
      if (rows?.[0]?.plan === "pro") tier = "pro";
    } catch { /* default free */ }
    return { userId: id, tier };
  } catch {
    return { userId: null, tier: "anon" };
  }
}
