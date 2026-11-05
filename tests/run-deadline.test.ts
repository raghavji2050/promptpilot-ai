import { describe, expect, it, vi } from "vitest";
import { handleRun } from "@/lib/run";
import { resetMemoryQuota } from "@/lib/run/quota";
import { runChain, textChain, RunProviderError, type TextProvider } from "@/lib/run/providers";

const CF = { CLOUDFLARE_ACCOUNT_ID: "a".repeat(32), CLOUDFLARE_API_TOKEN: "cf-test" };
const ALL = { GROQ_API_KEY: "gsk-test", ...CF };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json" } });

function fake(id: TextProvider["id"], impl: (timeoutMs?: number) => Promise<string>): TextProvider {
  return { id, name: id, model: "m", run: (_p, _f, t) => impl(t) };
}

describe("run chain deadline (Day 10)", () => {
  it("bad key (401/403) on Groq falls back to Workers AI", async () => {
    for (const st of [401, 403]) {
      const f = vi.fn(async (u: string | URL | Request) => String(u).includes("groq") ? json({}, st) : json({ result: { response: "cf" } })) as unknown as typeof fetch;
      const r = await runChain(textChain(ALL), "hi", f);
      expect(r.providerId).toBe("workers_ai");
    }
  });
  it("passes the remaining budget to each provider, capped by the deadline", async () => {
    let t = 0;
    const seen: (number | undefined)[] = [];
    const a = fake("groq", async (ms) => { seen.push(ms); t += 20_000; throw new RunProviderError(504, true, "timeout"); });
    const b = fake("workers_ai", async (ms) => { seen.push(ms); return "ok"; });
    const r = await runChain([a, b], "hi", fetch, { deadlineMs: 30_000, now: () => t });
    expect(r.output).toBe("ok");
    expect(seen).toEqual([30_000, 10_000]);
  });
  it("stops before the next provider when the budget is nearly gone", async () => {
    let t = 0;
    const b = vi.fn(async () => "never");
    const a = fake("groq", async () => { t += 29_000; throw new RunProviderError(502, true, "x"); });
    await expect(runChain([a, fake("workers_ai", b)], "hi", fetch, { deadlineMs: 30_000, now: () => t })).rejects.toMatchObject({ status: 504 });
    expect(b).not.toHaveBeenCalled();
  });
  it("timeout everywhere → friendly 'took too long' and run refunded", async () => {
    resetMemoryQuota();
    const env = { GROQ_API_KEY: "k", RUN_ANON_TEXT_PER_DAY: "1" };
    const slow = vi.fn(async () => { const e = new Error("t"); e.name = "TimeoutError"; throw e; }) as unknown as typeof fetch;
    const c = { ip: "9.9.9.9", country: "IN", authHeader: null, env, fetch: slow };
    const r = await handleRun({ kind: "text", prompt: "Write a Diwali caption" }, c);
    expect(r).toMatchObject({ ok: false, code: "PROVIDER" });
    expect(r.ok ? "" : r.message).toMatch(/too long/);
    const ok = vi.fn(async () => json({ choices: [{ message: { content: "yes" } }] })) as unknown as typeof fetch;
    expect(await handleRun({ kind: "text", prompt: "Write a Diwali caption" }, { ...c, fetch: ok })).toMatchObject({ ok: true });
  });
});
