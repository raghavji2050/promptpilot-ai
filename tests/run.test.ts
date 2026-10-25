import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleRun, getRunConfig, statusFor } from "@/lib/run";
import { consumeQuota, hashIp, istDay, resetMemoryQuota } from "@/lib/run/quota";
import { textChain, imageChain, runChain, RunProviderError } from "@/lib/run/providers";
import { verifyTurnstile } from "@/lib/run/turnstile";

const CF = { CLOUDFLARE_ACCOUNT_ID: "a".repeat(32), CLOUDFLARE_API_TOKEN: "cf-test" };
const ALL = { GROQ_API_KEY: "gsk-test", ...CF };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const groqOk = (t = "groq answer") => json({ choices: [{ message: { content: t } }] });
const cfOk = (t = "cf answer") => json({ result: { response: t }, success: true });

function router(map: Record<string, () => Response | Promise<Response>>) {
  return vi.fn(async (url: string | URL | Request) => {
    const u = String(url);
    for (const [k, fn] of Object.entries(map)) if (u.includes(k)) return fn();
    throw new Error(`unexpected fetch ${u}`);
  }) as unknown as typeof fetch & ReturnType<typeof vi.fn>;
}
const ctx = (env: Record<string, string>, f: typeof fetch, ip = "1.2.3.4") => ({ ip, country: "IN", authHeader: null, env, fetch: f });
const body = (kind: "text" | "image" = "text") => ({ kind, prompt: "Write a Diwali caption for my boutique" });

beforeEach(() => resetMemoryQuota());

describe("missing keys", () => {
  it("no providers → config unavailable and run returns UNAVAILABLE (503), never calls fetch", async () => {
    expect(getRunConfig("anon", {}).available).toEqual({ text: false, image: false });
    const f = router({});
    const r = await handleRun(body(), ctx({}, f));
    expect(r).toMatchObject({ ok: false, code: "UNAVAILABLE" });
    expect(statusFor(r)).toBe(503);
    expect(f).not.toHaveBeenCalled();
  });
  it("chains drop providers without keys; Gemini is off by default", () => {
    expect(textChain({ GROQ_API_KEY: "x" }).map((p) => p.id)).toEqual(["groq"]);
    expect(textChain(CF).map((p) => p.id)).toEqual(["workers_ai"]);
    expect(imageChain({ GROQ_API_KEY: "x" })).toHaveLength(0);
    expect(textChain({ GEMINI_API_KEY: "g" })).toHaveLength(0);
    expect(textChain({ GEMINI_API_KEY: "g", RUN_ENABLE_GEMINI: "1" }).map((p) => p.id)).toEqual(["gemini"]);
    expect(textChain({ GEMINI_API_KEY: "g", RUN_ENABLE_GEMINI: "1" }, "DE")).toHaveLength(0);
    expect(textChain({ CLOUDFLARE_ACCOUNT_ID: "bad", CLOUDFLARE_API_TOKEN: "t" })).toHaveLength(0);
  });
  it("config never leaks keys", () => {
    const c = JSON.stringify(getRunConfig("anon", { ...ALL, TURNSTILE_SITE_KEY: "site", TURNSTILE_SECRET_KEY: "secret-x" }));
    expect(c).not.toContain("gsk-test");
    expect(c).not.toContain("cf-test");
    expect(c).not.toContain("secret-x");
    expect(c).toContain("site");
  });
});

describe("provider fallback", () => {
  it("Groq 429 → Workers AI answers", async () => {
    const f = router({ "api.groq.com": () => json({}, 429), "api.cloudflare.com": () => cfOk() });
    const r = await handleRun(body(), ctx(ALL, f));
    expect(r).toMatchObject({ ok: true, text: "cf answer", provider: "Cloudflare Workers AI" });
  });
  it("Groq 503 and network error both fall back", async () => {
    for (const bad of [() => json({}, 503), () => { throw new TypeError("net"); }]) {
      const r = await runChain(textChain(ALL), "hi", router({ "api.groq.com": bad, "api.cloudflare.com": () => cfOk() }));
      expect(r.providerId).toBe("workers_ai");
    }
  });
  it("non-retryable 400 does not fall back", async () => {
    const f = router({ "api.groq.com": () => json({}, 400), "api.cloudflare.com": () => cfOk() });
    await expect(runChain(textChain(ALL), "hi", f)).rejects.toBeInstanceOf(RunProviderError);
    expect(f).toHaveBeenCalledTimes(1);
  });
  it("Groq first when healthy; result labelled with provider/model", async () => {
    const r = await handleRun(body(), ctx(ALL, router({ "api.groq.com": () => groqOk() })));
    expect(r).toMatchObject({ ok: true, text: "groq answer", label: "Groq · openai/gpt-oss-20b", remaining: 4, tier: "anon" });
  });
  it("all providers fail → PROVIDER error and the run is refunded", async () => {
    const env = { GROQ_API_KEY: "k", RUN_ANON_TEXT_PER_DAY: "1" };
    const r1 = await handleRun(body(), ctx(env, router({ "api.groq.com": () => json({}, 500) })));
    expect(r1).toMatchObject({ ok: false, code: "PROVIDER" });
    const r2 = await handleRun(body(), ctx(env, router({ "api.groq.com": () => groqOk() })));
    expect(r2.ok).toBe(true);
  });
  it("image uses flux-1-schnell and returns a data URL", async () => {
    const f = router({ "flux-1-schnell": () => json({ result: { image: "QUJD" } }) });
    const r = await handleRun(body("image"), ctx(CF, f));
    expect(r).toMatchObject({ ok: true, kind: "image", image: "data:image/jpeg;base64,QUJD", model: "@cf/black-forest-labs/flux-1-schnell" });
  });
});

describe("quota", () => {
  it("5 text per IP per day, then QUOTA (429); other IPs unaffected", async () => {
    const f = router({ "api.groq.com": () => groqOk() });
    for (let i = 0; i < 5; i++) expect((await handleRun(body(), ctx(ALL, f))).ok).toBe(true);
    const r = await handleRun(body(), ctx(ALL, f));
    expect(r).toMatchObject({ ok: false, code: "QUOTA" });
    expect(statusFor(r)).toBe(429);
    expect((await handleRun(body(), ctx(ALL, f, "9.9.9.9"))).ok).toBe(true);
  });
  it("1 image per IP per day by default", async () => {
    const f = router({ "flux-1-schnell": () => json({ result: { image: "QQ" } }) });
    expect((await handleRun(body("image"), ctx(CF, f))).ok).toBe(true);
    expect(await handleRun(body("image"), ctx(CF, f))).toMatchObject({ code: "QUOTA" });
  });
  it("site-wide cap stops everyone", async () => {
    const env = { ...ALL, RUN_SITE_TEXT_PER_DAY: "2" };
    const f = router({ "api.groq.com": () => groqOk() });
    await handleRun(body(), ctx(env, f, "1.1.1.1"));
    await handleRun(body(), ctx(env, f, "2.2.2.2"));
    expect(await handleRun(body(), ctx(env, f, "3.3.3.3"))).toMatchObject({ code: "SITE_CAP" });
  });
  it("hashIp is stable per day, rotates daily, never contains the IP", () => {
    expect(hashIp("1.2.3.4", "2026-10-25")).toBe(hashIp("1.2.3.4", "2026-10-25"));
    expect(hashIp("1.2.3.4", "2026-10-25")).not.toBe(hashIp("1.2.3.4", "2026-10-26"));
    expect(hashIp("1.2.3.4", "2026-10-25")).not.toContain("1.2.3.4");
    expect(istDay(new Date("2026-10-24T19:00:00Z"))).toBe("2026-10-25");
  });
  it("uses the Supabase RPC when configured", async () => {
    const env = { NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "srv" };
    const f = router({ "consume_run_quota": () => json([{ allowed: false, reason: "QUOTA", remaining: 0 }]) });
    expect(await consumeQuota("ip:abc", "text", 5, 100, { env, fetch: f })).toMatchObject({ allowed: false, reason: "QUOTA", degraded: false });
  });
  it("DB unreachable → in-memory fallback with a small per-instance site cap (fails closed)", async () => {
    const env = { NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "srv", RUN_FALLBACK_SITE_CAP: "2" };
    const f = router({ "consume_run_quota": () => json({}, 500) });
    const a = await consumeQuota("ip:a", "text", 5, 250, { env, fetch: f });
    expect(a).toMatchObject({ allowed: true, degraded: true });
    await consumeQuota("ip:b", "text", 5, 250, { env, fetch: f });
    expect(await consumeQuota("ip:c", "text", 5, 250, { env, fetch: f })).toMatchObject({ allowed: false, reason: "SITE_CAP" });
  });
  it("logged-in users get a higher limit; pro tier is configurable", async () => {
    const uid = "11111111-2222-3333-4444-555555555555";
    const env = { ...ALL, NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "srv", NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon" };
    const f = router({
      "/auth/v1/user": () => json({ id: uid }),
      "/rest/v1/profiles": () => json([{ plan: "free" }]),
      "consume_run_quota": () => json([{ allowed: true, remaining: 9 }]),
      "api.groq.com": () => groqOk(),
    });
    const r = await handleRun(body(), { ip: "1.2.3.4", country: null, authHeader: `Bearer ${"t".repeat(40)}`, env, fetch: f });
    expect(r).toMatchObject({ ok: true, tier: "free", remaining: 9 });
    const rpc = (f.mock.calls as [string, RequestInit][]).find(([u]) => String(u).includes("consume_run_quota"))!;
    expect(JSON.parse(String(rpc[1].body))).toMatchObject({ p_subject: `u:${uid}`, p_limit: 10 });
    expect(getRunConfig("pro", { RUN_PRO_TEXT_PER_DAY: "99" }).limits.text).toBe(99);
  });
});

describe("turnstile", () => {
  it("skipped when secret unset", async () => {
    expect(await verifyTurnstile(undefined, null, { env: {} })).toEqual({ ok: true, skipped: true });
  });
  it("missing or rejected token → TURNSTILE 403 and no provider call, no quota used", async () => {
    const env = { ...ALL, TURNSTILE_SECRET_KEY: "sec" };
    const f = router({ siteverify: () => json({ success: false }), "api.groq.com": () => groqOk() });
    const r1 = await handleRun(body(), ctx(env, f));
    expect(r1).toMatchObject({ code: "TURNSTILE" });
    const r2 = await handleRun({ ...body(), turnstileToken: "bad" }, ctx(env, f));
    expect(r2).toMatchObject({ code: "TURNSTILE" });
    expect(statusFor(r2)).toBe(403);
    expect((f.mock.calls as [string][]).some(([u]) => String(u).includes("groq"))).toBe(false);
  });
  it("valid token passes; siteverify network failure fails closed", async () => {
    const env = { ...ALL, TURNSTILE_SECRET_KEY: "sec" };
    const ok = await handleRun({ ...body(), turnstileToken: "good" }, ctx(env, router({ siteverify: () => json({ success: true }), "api.groq.com": () => groqOk() })));
    expect(ok.ok).toBe(true);
    const down = await handleRun({ ...body(), turnstileToken: "good" }, ctx(env, router({ siteverify: () => { throw new TypeError("net"); } })));
    expect(down).toMatchObject({ code: "TURNSTILE" });
  });
});

describe("validation", () => {
  it("rejects empty/oversized prompts and bad kinds (video is not runnable)", async () => {
    const f = router({});
    expect(await handleRun({ kind: "text", prompt: "" }, ctx(ALL, f))).toMatchObject({ code: "VALIDATION" });
    expect(await handleRun({ kind: "text", prompt: "x".repeat(8001) }, ctx(ALL, f))).toMatchObject({ code: "VALIDATION" });
    expect(await handleRun({ kind: "video", prompt: "a cat video" }, ctx(ALL, f))).toMatchObject({ code: "VALIDATION" });
  });
});

import { buildUniversal } from "@/lib/engine/universal";
describe("intent regression found in live check", () => {
  it("React hooks route to coding, social hooks stay social", () => {
    const cat = (g: string) => buildUniversal({ goal: g, targetId: "chatgpt" } as never).category?.id;
    expect(cat("Write a React hook to debounce search input")).toBe("coding");
    expect(cat("Write a custom hook for fetching data in React")).toBe("coding");
    expect(cat("Instagram caption hooks for my salon")).toBe("social");
  });
});
