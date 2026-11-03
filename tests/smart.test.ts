import { describe, expect, it } from "vitest";
import { smartImprove, smartEnabled } from "@/lib/smart";
import { improveText } from "@/lib/engine";

describe("smart mode", () => {
  it("falls back to the deterministic improver with no provider keys", async () => {
    const r = await smartImprove("write a blog about tea", "chatgpt", { env: {} });
    expect(r).toEqual({ text: improveText("write a blog about tea", "chatgpt"), source: "fallback" });
    expect(smartEnabled({})).toBe(false);
  });
  it("uses Groq when configured", async () => {
    const f = (async () => new Response(JSON.stringify({ choices: [{ message: { content: "Better prompt" } }] }), { status: 200 })) as typeof fetch;
    const r = await smartImprove("x", "chatgpt", { env: { GROQ_API_KEY: "k" }, fetch: f });
    expect(r).toMatchObject({ text: "Better prompt", source: "ai", provider: "Groq" });
  });
  it("falls back when Groq errors", async () => {
    const f = (async () => new Response("no", { status: 429 })) as typeof fetch;
    const r = await smartImprove("write a blog", "chatgpt", { env: { GROQ_API_KEY: "k" }, fetch: f });
    expect(r.source).toBe("fallback");
  });
});
