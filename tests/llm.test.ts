import { afterEach, describe, expect, it, vi } from "vitest";
import { assertSafeBaseUrl, enhance, EnhanceSchema, ProviderError } from "@/lib/llm";
import { rateLimit } from "@/lib/llm/ratelimit";

describe("assertSafeBaseUrl", () => {
  it.each(["http://api.example.com/v1", "https://localhost/v1", "https://127.0.0.1/v1", "https://10.1.2.3", "https://192.168.0.5", "https://169.254.169.254/latest", "https://[::1]/", "https://foo.internal/v1", "https://user:pw@api.example.com", "https://intranet/"])(
    "rejects %s", (u) => { expect(() => assertSafeBaseUrl(u)).toThrow(ProviderError); },
  );
  it("accepts a public https URL", () => {
    expect(assertSafeBaseUrl("https://api.example.com/v1").hostname).toBe("api.example.com");
    expect(() => assertSafeBaseUrl("https://8.8.8.8/v1")).not.toThrow();
  });
});

describe("EnhanceSchema", () => {
  it("rejects bad provider, empty input and odd model names", () => {
    expect(EnhanceSchema.safeParse({ provider: "x", model: "m", input: "hi" }).success).toBe(false);
    expect(EnhanceSchema.safeParse({ provider: "openai", model: "m", input: "" }).success).toBe(false);
    expect(EnhanceSchema.safeParse({ provider: "openai", model: "m; rm -rf", input: "hi" }).success).toBe(false);
    expect(EnhanceSchema.safeParse({ provider: "openai", model: "x".repeat(81), input: "hi" }).success).toBe(false);
    expect(EnhanceSchema.safeParse({ provider: "openai", model: "some-model", input: "hi" }).success).toBe(true);
  });
});

describe("enhance() adapters (fetch mocked)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("openai-style: sends bearer key to the right URL and parses content", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: "Improved" } }], usage: { prompt_tokens: 5, completion_tokens: 2 } }), { status: 200 }));
    const r = await enhance({ provider: "xai", model: "m", input: "hi" }, "KEY");
    expect(r.text).toBe("Improved");
    const [url, init] = spy.mock.calls[0]!;
    expect(url).toBe("https://api.x.ai/v1/chat/completions");
    expect((init!.headers as Record<string, string>).authorization).toBe("Bearer KEY");
  });

  it("anthropic: uses x-api-key and parses text blocks", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ content: [{ type: "text", text: "Better" }] }), { status: 200 }));
    const r = await enhance({ provider: "anthropic", model: "m", input: "hi" }, "AK");
    expect(r.text).toBe("Better");
    expect(spy.mock.calls[0]![0]!).toBe("https://api.anthropic.com/v1/messages");
    expect((spy.mock.calls[0]![1]!.headers as Record<string, string>)["x-api-key"]).toBe("AK");
  });

  it("maps 401 to UPSTREAM_AUTH", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("no", { status: 401 }));
    await expect(enhance({ provider: "openai", model: "m", input: "hi" }, "bad")).rejects.toMatchObject({ code: "UPSTREAM_AUTH" });
  });

  it("openai_compatible requires a safe baseUrl", async () => {
    await expect(enhance({ provider: "openai_compatible", model: "m", input: "hi" }, "k")).rejects.toMatchObject({ code: "BAD_BASE_URL" });
    await expect(enhance({ provider: "openai_compatible", model: "m", input: "hi", baseUrl: "https://127.0.0.1" }, "k")).rejects.toMatchObject({ code: "BAD_BASE_URL" });
  });
});

describe("rateLimit", () => {
  it("allows up to limit then blocks until window resets", () => {
    const k = "t-" + Math.random();
    expect(rateLimit(k, 2, 1000, 0).ok).toBe(true);
    expect(rateLimit(k, 2, 1000, 1).ok).toBe(true);
    const third = rateLimit(k, 2, 1000, 2);
    expect(third.ok).toBe(false);
    expect(third.retryAfter).toBe(1);
    expect(rateLimit(k, 2, 1000, 1001).ok).toBe(true);
  });
});
