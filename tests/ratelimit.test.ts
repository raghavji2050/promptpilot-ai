import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkLimit, clientIp, limitHeaders, limitRules, resetLimiterState, tooManyMessage } from "@/lib/ratelimit";

const SB = { NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "svc" };
let n = 0;
const ip = () => `10.0.0.${++n}-${Math.random()}`;
const t0 = new Date("2026-11-01T01:00:00Z");

beforeEach(() => resetLimiterState());
afterEach(() => vi.restoreAllMocks());

describe("clientIp", () => {
  it("prefers x-real-ip, then first x-forwarded-for hop, else unknown", () => {
    expect(clientIp(new Headers({ "x-real-ip": "1.1.1.1", "x-forwarded-for": "2.2.2.2" }))).toBe("1.1.1.1");
    expect(clientIp(new Headers({ "x-forwarded-for": "2.2.2.2, 3.3.3.3" }))).toBe("2.2.2.2");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

describe("limitRules", () => {
  it("has sane defaults and env overrides", () => {
    const r = limitRules({});
    expect(r.enhance.limit).toBe(10);
    expect(r.card.limit).toBe(30);
    expect(r.run.limit).toBe(6);
    expect(r.run.daily).toBeUndefined();
    expect(limitRules({ RL_ENHANCE_PER_MIN: "3" }).enhance.limit).toBe(3);
    expect(limitRules({ RL_ENHANCE_PER_MIN: "nope" }).enhance.limit).toBe(10);
  });
});

describe("checkLimit (in-memory, no service role)", () => {
  it("allows up to the per-minute limit then 429s with Retry-After, resets after the window", async () => {
    const env = { RL_ENHANCE_PER_MIN: "3" };
    const a = ip();
    for (let i = 0; i < 3; i++) expect((await checkLimit("enhance", a, { env, now: t0 })).ok).toBe(true);
    const blocked = await checkLimit("enhance", a, { env, now: new Date(t0.getTime() + 20_000) });
    expect(blocked).toMatchObject({ ok: false, reason: "BURST", store: "memory", retryAfter: 40 });
    expect(limitHeaders(blocked)).toMatchObject({ "Retry-After": "40", "X-RateLimit-Remaining": "0", "X-RateLimit-Store": "memory" });
    expect(tooManyMessage(blocked)).toMatch(/40s/);
    expect((await checkLimit("enhance", a, { env, now: new Date(t0.getTime() + 60_001) })).ok).toBe(true);
  });

  it("keeps scopes and IPs separate", async () => {
    const env = { RL_ENHANCE_PER_MIN: "1", RL_CARD_PER_MIN: "1" };
    const a = ip();
    expect((await checkLimit("enhance", a, { env, now: t0 })).ok).toBe(true);
    expect((await checkLimit("card", a, { env, now: t0 })).ok).toBe(true);
    expect((await checkLimit("enhance", ip(), { env, now: t0 })).ok).toBe(true);
    expect((await checkLimit("enhance", a, { env, now: t0 })).ok).toBe(false);
  });

  it("never calls Supabase without a service role", async () => {
    const f = vi.fn();
    await checkLimit("enhance", ip(), { env: { NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co" }, fetch: f as unknown as typeof fetch, now: t0 });
    expect(f).not.toHaveBeenCalled();
  });
});

describe("checkLimit (Supabase daily cap)", () => {
  it("uses the RPC with a hashed subject and the scope as kind", async () => {
    const f = vi.fn().mockResolvedValue(new Response(JSON.stringify([{ allowed: true, reason: null, remaining: 150 }]), { status: 200 }));
    const r = await checkLimit("enhance", "9.9.9.9", { env: SB, fetch: f as unknown as typeof fetch, now: t0 });
    expect(r).toMatchObject({ ok: true, store: "supabase" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://x.supabase.co/rest/v1/rpc/consume_run_quota");
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({ p_kind: "enhance", p_limit: 200, p_day: "2026-11-01" });
    expect(body.p_subject).toMatch(/^ip:[0-9a-f]{40}$/);
    expect(String(init.body)).not.toContain("9.9.9.9");
  });

  it("returns DAILY 429 with Retry-After until IST midnight when the DB says no", async () => {
    const f = vi.fn().mockResolvedValue(new Response(JSON.stringify([{ allowed: false, reason: "QUOTA", remaining: 0 }]), { status: 200 }));
    const r = await checkLimit("card", ip(), { env: SB, fetch: f as unknown as typeof fetch, now: t0 });
    // 01:00Z = 06:30 IST → 17.5h to midnight IST
    expect(r).toMatchObject({ ok: false, reason: "DAILY", retryAfter: 17.5 * 3600 });
    expect(tooManyMessage(r)).toMatch(/tomorrow/);
  });

  it("degrades to in-memory (no throw, no 500) when run-quota.sql is not applied, and backs off the DB", async () => {
    const f = vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: "PGRST202", message: "Could not find the function" }), { status: 404 }));
    const a = ip();
    const r1 = await checkLimit("enhance", a, { env: SB, fetch: f as unknown as typeof fetch, now: t0 });
    expect(r1).toMatchObject({ ok: true, store: "memory" });
    const r2 = await checkLimit("enhance", a, { env: SB, fetch: f as unknown as typeof fetch, now: new Date(t0.getTime() + 1000) });
    expect(r2.ok).toBe(true);
    expect(f).toHaveBeenCalledTimes(1); // backoff: second call skipped the DB
  });

  it("degrades on network errors / bad shapes too", async () => {
    const boom = vi.fn().mockRejectedValue(new Error("ECONNRESET"));
    expect((await checkLimit("card", ip(), { env: SB, fetch: boom as unknown as typeof fetch, now: t0 })).ok).toBe(true);
    resetLimiterState();
    const odd = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    expect((await checkLimit("card", ip(), { env: SB, fetch: odd as unknown as typeof fetch, now: t0 })).ok).toBe(true);
  });

  it("burst limit still applies before the DB is consulted", async () => {
    const f = vi.fn().mockResolvedValue(new Response(JSON.stringify([{ allowed: true, remaining: 5 }]), { status: 200 }));
    const env = { ...SB, RL_ENHANCE_PER_MIN: "1" };
    const a = ip();
    await checkLimit("enhance", a, { env, fetch: f as unknown as typeof fetch, now: t0 });
    const r = await checkLimit("enhance", a, { env, fetch: f as unknown as typeof fetch, now: t0 });
    expect(r).toMatchObject({ ok: false, reason: "BURST" });
    expect(f).toHaveBeenCalledTimes(1);
  });
});
