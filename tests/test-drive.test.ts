import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTestDriveConfig, handleTestDrive, runSideBySide, testDriveStatus, TestDriveSchema, TEST_DRIVE_CALL_TIMEOUT_MS } from "@/lib/run/test-drive";
import { deterministicTestDrive, outputSignals, testDriveTarget, TEST_DRIVE_SAMPLES } from "@/lib/engine/test-drive";
import { analyzePrompt } from "@/lib/engine";
import { resetMemoryQuota } from "@/lib/run/quota";
import { RunProviderError, type TextProvider } from "@/lib/run/providers";

const CF = { CLOUDFLARE_ACCOUNT_ID: "a".repeat(32), CLOUDFLARE_API_TOKEN: "cf-test" };
const GEM = { GEMINI_API_KEY: "gem-test", RUN_ENABLE_GEMINI: "1" };
const ALL = { GROQ_API_KEY: "gsk-test", ...CF, ...GEM };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const groqOk = (t: string) => json({ choices: [{ message: { content: t } }] });
const cfOk = (t: string) => json({ result: { response: t }, success: true });
const gemOk = (t: string) => json({ candidates: [{ content: { parts: [{ text: t }] } }] });

type Handler = (prompt: string) => Response | Promise<Response>;
/** Routes by provider URL; hands the user prompt to the handler so raw vs improved can answer differently. */
function router(map: Record<string, Handler>) {
  return vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const u = String(url);
    const b = init?.body && typeof init.body === "string" ? JSON.parse(init.body) : null;
    const prompt: string = b?.messages?.[1]?.content ?? b?.contents?.[0]?.parts?.[0]?.text ?? "";
    for (const [k, fn] of Object.entries(map)) if (u.includes(k)) return fn(prompt);
    throw new Error(`unexpected fetch ${u}`);
  }) as unknown as typeof fetch & ReturnType<typeof vi.fn>;
}
const ctx = (env: Record<string, string>, f: typeof fetch, ip = "1.2.3.4") => ({ ip, country: "IN", authHeader: null, env, fetch: f });
const IDEA = "write a cold email for my SaaS product";
const isRaw = (p: string) => p === IDEA;

beforeEach(() => resetMemoryQuota());

describe("validation", () => {
  it("accepts the documented shape and rejects bad input", async () => {
    expect(TestDriveSchema.safeParse({ rawIdea: IDEA }).success).toBe(true);
    expect(TestDriveSchema.safeParse({ rawIdea: "hi" }).success).toBe(false);
    expect(TestDriveSchema.safeParse({ rawIdea: "x".repeat(2001) }).success).toBe(false);
    expect(TestDriveSchema.safeParse({ rawIdea: IDEA, improvedPrompt: "ok" }).success).toBe(false);
    expect(TestDriveSchema.safeParse({ rawIdea: IDEA, improvedPrompt: "x".repeat(8001) }).success).toBe(false);
    const f = router({});
    for (const bad of [null, {}, { rawIdea: 5 }, { rawIdea: "  a " }]) {
      const r = await handleTestDrive(bad, ctx(ALL, f));
      expect(r).toMatchObject({ ok: false, code: "VALIDATION" });
      expect(testDriveStatus(r)).toBe(400);
    }
    expect(f).not.toHaveBeenCalled();
  });
});

describe("deterministic scoring", () => {
  it("generates the improved prompt with the universal engine and scores both sides", () => {
    const d = deterministicTestDrive(IDEA);
    expect(d.generated).toBe(true);
    expect(d.target).toBe("chatgpt");
    expect(d.improvedPrompt.length).toBeGreaterThan(IDEA.length * 3);
    expect(d.raw.score).toBe(analyzePrompt(IDEA).score);
    expect(d.improved.score).toBe(analyzePrompt(d.improvedPrompt).score);
    expect(d.scoreDelta).toBe(d.improved.score - d.raw.score);
    expect(d.scoreDelta).toBeGreaterThan(0);
    expect(d.addedChips.length).toBeGreaterThan(0);
    expect(d.raw.issues.length).toBeGreaterThan(d.improved.issues.length);
  });
  it("is deterministic and honours the chosen target", () => {
    expect(deterministicTestDrive(IDEA, undefined, "claude")).toEqual(deterministicTestDrive(IDEA, undefined, "claude"));
    expect(deterministicTestDrive(IDEA, undefined, "claude").improvedPrompt).toMatch(/<\w+>/);
    expect(testDriveTarget("midjourney")).toBe("chatgpt");
    expect(testDriveTarget("nope")).toBe("chatgpt");
    expect(testDriveTarget("grok")).toBe("grok");
  });
  it("uses a caller-supplied improved prompt as-is, with no generated chips", () => {
    const mine = "You are a B2B copywriter. Write a 120-word cold email for our SaaS to CTOs. Must avoid hype. Format: subject + 3 short paragraphs.";
    const d = deterministicTestDrive(IDEA, mine);
    expect(d.generated).toBe(false);
    expect(d.improvedPrompt).toBe(mine);
    expect(d.addedChips).toEqual([]);
    expect(d.scoreDelta).toBe(analyzePrompt(mine).score - analyzePrompt(IDEA).score);
  });
  it("every sample improves", () => {
    for (const s of TEST_DRIVE_SAMPLES) expect(deterministicTestDrive(s.idea).scoreDelta, s.id).toBeGreaterThan(0);
  });
  it("output signals are plain facts", () => {
    expect(outputSignals(undefined)).toEqual({ words: 0, hasStructure: false, hasPlaceholders: false });
    expect(outputSignals("Hello there friend")).toEqual({ words: 3, hasStructure: false, hasPlaceholders: false });
    expect(outputSignals("## Subject\n- Hi [Name]\n1. Step")).toMatchObject({ hasStructure: true, hasPlaceholders: true });
  });
});

describe("0-provider mode", () => {
  it("returns ok with the deterministic comparison only, no fetch, no fake outputs", async () => {
    const f = router({});
    const r = await handleTestDrive({ rawIdea: IDEA }, ctx({ TURNSTILE_SECRET_KEY: "secret" }, f));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r).toMatchObject({ providersAvailable: [], models: [], live: "off" });
    expect(r.scoreDelta).toBe(r.improved.score - r.raw.score);
    expect(testDriveStatus(r)).toBe(200);
    expect(f).not.toHaveBeenCalled();
  });
});

describe("live side-by-side", () => {
  it("runs raw and improved on up to 3 providers in parallel", async () => {
    const f = router({
      "api.groq.com": (p) => groqOk(isRaw(p) ? "groq short" : "## Subject\n- Hi [Name]"),
      "api.cloudflare.com": (p) => cfOk(isRaw(p) ? "cf short" : "1. Hook\n2. Value"),
      generativelanguage: (p) => gemOk(isRaw(p) ? "gem short" : "- point one"),
    });
    const r = await handleTestDrive({ rawIdea: IDEA }, ctx(ALL, f));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.live).toBe("ok");
    expect(r.providersAvailable).toEqual(["Groq", "Cloudflare Workers AI", "Google Gemini"]);
    expect(r.models.map((m) => m.id)).toEqual(["groq", "workers_ai", "gemini"]);
    expect(f).toHaveBeenCalledTimes(6);
    const g = r.models[0];
    expect(g).toMatchObject({ rawOutput: "groq short", improvedOutput: "## Subject\n- Hi [Name]", signals: { rawWords: 2, improvedWords: 5, hasStructure: true, hasPlaceholders: true, rawHasStructure: false } });
    expect(typeof g?.rawMs).toBe("number");
    expect(typeof g?.improvedMs).toBe("number");
    expect(r.remaining).toBe(4);
    expect(JSON.stringify(r)).not.toMatch(/gsk-test|cf-test|gem-test/);
  });

  it("calls really overlap (parallel, not sequential)", async () => {
    let inFlight = 0, peak = 0;
    const slow = (t: string) => async () => { inFlight++; peak = Math.max(peak, inFlight); await new Promise((r) => setTimeout(r, 20)); inFlight--; return groqOk(t); };
    const f = router({ "api.groq.com": slow("a"), "api.cloudflare.com": async () => { inFlight++; peak = Math.max(peak, inFlight); await new Promise((r) => setTimeout(r, 20)); inFlight--; return cfOk("b"); } });
    await handleTestDrive({ rawIdea: IDEA }, ctx({ GROQ_API_KEY: "g", ...CF }, f));
    expect(peak).toBe(4);
  });

  it("partial failure: one provider failing never breaks the others", async () => {
    const f = router({
      "api.groq.com": () => json({}, 500),
      "api.cloudflare.com": (p) => (isRaw(p) ? cfOk("cf raw") : json({}, 429)),
      generativelanguage: (p) => gemOk(isRaw(p) ? "gem raw" : "gem improved"),
    });
    const r = await handleTestDrive({ rawIdea: IDEA }, ctx(ALL, f));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.live).toBe("partial");
    expect(r.models[0]).toMatchObject({ id: "groq", error: expect.stringContaining("Raw") });
    expect(r.models[0]?.rawOutput).toBeUndefined();
    expect(r.models[1]).toMatchObject({ rawOutput: "cf raw", error: "Improved: Busy (free limit reached)" });
    expect(r.models[2]).toMatchObject({ rawOutput: "gem raw", improvedOutput: "gem improved" });
    expect(r.models[2]?.error).toBeUndefined();
  });

  it("all providers fail → quota is released, live=failed, deterministic result still returned", async () => {
    const f = router({ "api.groq.com": () => json({}, 503), "api.cloudflare.com": () => { throw new TypeError("network"); } });
    const env = { GROQ_API_KEY: "g", ...CF, RUN_ANON_TEXT_PER_DAY: "1" };
    const r = await handleTestDrive({ rawIdea: IDEA }, ctx(env, f));
    expect(r).toMatchObject({ ok: true, live: "failed" });
    if (r.ok) expect(r.models.every((m) => m.error && !m.rawOutput && !m.improvedOutput)).toBe(true);
    // the unit was given back, so the same user can try again
    const again = await handleTestDrive({ rawIdea: IDEA }, ctx(env, router({ "api.groq.com": () => groqOk("x"), "api.cloudflare.com": () => cfOk("y") })));
    expect(again).toMatchObject({ ok: true, live: "ok" });
  });

  it("caps at 3 models and passes the per-call timeout to providers", async () => {
    const seen: number[] = [];
    const mk = (id: TextProvider["id"]): TextProvider => ({ id, name: id, model: "m", run: async (p, _f, t) => { seen.push(t ?? -1); return p.slice(0, 5); } });
    const out = await runSideBySide([mk("groq"), mk("workers_ai"), mk("gemini")], IDEA, "improved prompt", fetch);
    expect(out).toHaveLength(3);
    expect(seen).toEqual(Array(6).fill(TEST_DRIVE_CALL_TIMEOUT_MS));
  });

  it("a provider that hangs past the timeout is cut off without blocking the rest", async () => {
    vi.useFakeTimers();
    try {
      const hang: TextProvider = { id: "groq", name: "Groq", model: "m", run: () => new Promise(() => {}) };
      const ok: TextProvider = { id: "workers_ai", name: "CF", model: "m", run: async () => "fine" };
      const p = runSideBySide([hang, ok], IDEA, "improved", fetch);
      await vi.advanceTimersByTimeAsync(TEST_DRIVE_CALL_TIMEOUT_MS + 1000);
      const out = await p;
      expect(out[0]).toMatchObject({ error: "Raw: Timed out · Improved: Timed out" });
      expect(out[1]).toMatchObject({ rawOutput: "fine", improvedOutput: "fine" });
    } finally { vi.useRealTimers(); }
  });

  it("maps provider errors to short honest labels", async () => {
    const bad = (s: number): TextProvider => ({ id: "groq", name: "G", model: "m", run: async () => { throw new RunProviderError(s, true, "x"); } });
    const [a] = await runSideBySide([bad(401)], IDEA, "imp", fetch);
    expect(a?.error).toBe("Raw: Not available right now · Improved: Not available right now");
  });
});

describe("turnstile + quota enforcement", () => {
  it("rejects a missing/failed Turnstile token before any model call", async () => {
    const f = router({ challenges: () => json({ success: false }), "api.groq.com": () => groqOk("x") });
    const env = { GROQ_API_KEY: "g", TURNSTILE_SECRET_KEY: "secret" };
    const r1 = await handleTestDrive({ rawIdea: IDEA }, ctx(env, f));
    expect(r1).toMatchObject({ ok: false, code: "TURNSTILE" });
    expect(testDriveStatus(r1)).toBe(403);
    const r2 = await handleTestDrive({ rawIdea: IDEA, turnstileToken: "tok" }, ctx(env, f));
    expect(r2).toMatchObject({ ok: false, code: "TURNSTILE" });
    expect(f.mock.calls.some(([u]) => String(u).includes("groq"))).toBe(false);
  });
  it("passes with a valid Turnstile token", async () => {
    const f = router({ challenges: () => json({ success: true }), "api.groq.com": () => groqOk("x") });
    const r = await handleTestDrive({ rawIdea: IDEA, turnstileToken: "tok" }, ctx({ GROQ_API_KEY: "g", TURNSTILE_SECRET_KEY: "secret" }, f));
    expect(r).toMatchObject({ ok: true, live: "ok" });
  });
  it("consumes 1 unit per test drive and enforces the daily limit", async () => {
    const env = { GROQ_API_KEY: "g", RUN_ANON_TEXT_PER_DAY: "2" };
    const f = router({ "api.groq.com": () => groqOk("x") });
    expect(await handleTestDrive({ rawIdea: IDEA }, ctx(env, f))).toMatchObject({ ok: true, remaining: 1 });
    expect(await handleTestDrive({ rawIdea: IDEA }, ctx(env, f))).toMatchObject({ ok: true, remaining: 0 });
    const r = await handleTestDrive({ rawIdea: IDEA }, ctx(env, f));
    expect(r).toMatchObject({ ok: false, code: "QUOTA" });
    expect(testDriveStatus(r)).toBe(429);
    expect(f).toHaveBeenCalledTimes(4);
    // another IP still has its own quota
    expect(await handleTestDrive({ rawIdea: IDEA }, ctx(env, f, "9.9.9.9"))).toMatchObject({ ok: true });
  });
  it("site-wide cap returns SITE_CAP", async () => {
    const env = { GROQ_API_KEY: "g", RUN_SITE_TEXT_PER_DAY: "1" };
    const f = router({ "api.groq.com": () => groqOk("x") });
    await handleTestDrive({ rawIdea: IDEA }, ctx(env, f, "1.1.1.1"));
    expect(await handleTestDrive({ rawIdea: IDEA }, ctx(env, f, "2.2.2.2"))).toMatchObject({ ok: false, code: "SITE_CAP" });
  });
});

describe("config", () => {
  it("lists free text models without leaking keys", () => {
    const c = getTestDriveConfig("anon", { ...ALL, TURNSTILE_SITE_KEY: "site-k", TURNSTILE_SECRET_KEY: "secret-x" }, "IN");
    expect(c.providers.map((p) => p.id)).toEqual(["groq", "workers_ai", "gemini"]);
    expect(c.turnstileSiteKey).toBe("site-k");
    expect(JSON.stringify(c)).not.toMatch(/gsk-test|cf-test|gem-test|secret-x/);
    expect(getTestDriveConfig("anon", ALL, "DE").providers.map((p) => p.id)).toEqual(["groq", "workers_ai"]);
    expect(getTestDriveConfig("anon", {}).providers).toEqual([]);
  });
});
