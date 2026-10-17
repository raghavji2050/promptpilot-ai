import { z } from "zod";

export type { ProviderId } from "./providers-meta";

export const ENHANCER_SYSTEM_PROMPT_V1 = [
  "You improve prompts that a user will paste into an AI model.",
  "Rewrite the user's prompt so it is clear, specific and well-structured for the stated target model.",
  "Keep the user's intent, facts and constraints. Do not invent facts, numbers, names or sources.",
  "Where information is missing, insert a short bracketed placeholder like [your audience] instead of guessing.",
  "Return only the improved prompt, with no preamble or explanation.",
].join(" ");

export const EnhanceSchema = z.object({
  provider: z.enum(["openai", "anthropic", "xai", "openai_compatible"]),
  model: z.string().trim().min(1).max(80).regex(/^[A-Za-z0-9._:\/-]+$/, "Invalid model name"),
  input: z.string().trim().min(1).max(8000),
  target: z.string().trim().max(40).optional(),
  baseUrl: z.string().trim().url().max(300).optional(),
});
export type EnhanceBody = z.infer<typeof EnhanceSchema>;

export interface EnhanceResult { text: string; latencyMs: number; usage?: { input?: number; output?: number } }

export class ProviderError extends Error {
  constructor(public code: "UPSTREAM_ERROR" | "UPSTREAM_AUTH" | "UPSTREAM_TIMEOUT" | "BAD_BASE_URL", message: string, public status = 502) { super(message); }
}

const PRIVATE_V4 = [
  [10, 0, 0, 0, 8], [127, 0, 0, 0, 8], [169, 254, 0, 0, 16], [172, 16, 0, 0, 12], [192, 168, 0, 0, 16],
  [0, 0, 0, 0, 8], [100, 64, 0, 0, 10], [192, 0, 0, 0, 24], [198, 18, 0, 0, 15], [224, 0, 0, 0, 4],
] as const;

function ipv4ToInt(ip: string): number | null {
  const m = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const p = m.slice(1).map(Number);
  if (p.some((n) => n > 255)) return null;
  return ((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3];
}

/**
 * Basic SSRF guard for user-supplied base URLs. Blocks non-https, localhost-style names,
 * and private/reserved IP literals. Known gap: does not resolve DNS, so a public hostname
 * that resolves to a private IP (DNS rebinding) is not caught here.
 */
export function assertSafeBaseUrl(raw: string): URL {
  let u: URL;
  try { u = new URL(raw); } catch { throw new ProviderError("BAD_BASE_URL", "Invalid base URL", 400); }
  if (u.protocol !== "https:") throw new ProviderError("BAD_BASE_URL", "Base URL must use https", 400);
  if (u.username || u.password) throw new ProviderError("BAD_BASE_URL", "Credentials in URL are not allowed", 400);
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") || !host.includes(".") && !host.includes(":")) {
    throw new ProviderError("BAD_BASE_URL", "Local hostnames are not allowed", 400);
  }
  const n = ipv4ToInt(host);
  if (n !== null) {
    for (const [a, b, c, d, bits] of PRIVATE_V4) {
      const base = ipv4ToInt(`${a}.${b}.${c}.${d}`)!;
      const mask = (~0 << (32 - bits)) >>> 0;
      if (((n & mask) >>> 0) === ((base & mask) >>> 0)) throw new ProviderError("BAD_BASE_URL", "Private IP addresses are not allowed", 400);
    }
  }
  if (host.includes(":")) {
    if (host === "::1" || host === "::" || /^f[cd]/.test(host) || /^fe[89ab]/.test(host) || host.startsWith("::ffff:")) {
      throw new ProviderError("BAD_BASE_URL", "Private IP addresses are not allowed", 400);
    }
  }
  return u;
}

function userMessage(body: EnhanceBody) {
  return `Target model: ${body.target || "general chat assistant"}\n\nPrompt to improve:\n"""\n${body.input}\n"""`;
}

async function call(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal, redirect: "error" });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw new ProviderError("UPSTREAM_TIMEOUT", "The provider took too long to respond", 504);
    throw new ProviderError("UPSTREAM_ERROR", "Could not reach the provider");
  } finally {
    clearTimeout(t);
  }
}

function mapStatus(status: number): never {
  if (status === 401 || status === 403) throw new ProviderError("UPSTREAM_AUTH", "The provider rejected the API key", 401);
  if (status === 429) throw new ProviderError("UPSTREAM_ERROR", "The provider rate-limited this key", 429);
  throw new ProviderError("UPSTREAM_ERROR", `Provider error (HTTP ${status})`);
}

async function openAiStyle(baseUrl: string, body: EnhanceBody, key: string, timeoutMs: number): Promise<EnhanceResult> {
  const started = Date.now();
  const res = await call(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: body.model,
      messages: [{ role: "system", content: ENHANCER_SYSTEM_PROMPT_V1 }, { role: "user", content: userMessage(body) }],
      max_tokens: 1200,
    }),
  }, timeoutMs);
  if (!res.ok) mapStatus(res.status);
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[]; usage?: { prompt_tokens?: number; completion_tokens?: number } };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) throw new ProviderError("UPSTREAM_ERROR", "Empty response from provider");
  return { text, latencyMs: Date.now() - started, usage: { input: json.usage?.prompt_tokens, output: json.usage?.completion_tokens } };
}

async function anthropic(body: EnhanceBody, key: string, timeoutMs: number): Promise<EnhanceResult> {
  const started = Date.now();
  const res = await call("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: body.model, max_tokens: 1200, system: ENHANCER_SYSTEM_PROMPT_V1, messages: [{ role: "user", content: userMessage(body) }] }),
  }, timeoutMs);
  if (!res.ok) mapStatus(res.status);
  const json = (await res.json()) as { content?: { type: string; text?: string }[]; usage?: { input_tokens?: number; output_tokens?: number } };
  const text = json.content?.filter((c) => c.type === "text").map((c) => c.text).join("\n").trim();
  if (!text) throw new ProviderError("UPSTREAM_ERROR", "Empty response from provider");
  return { text, latencyMs: Date.now() - started, usage: { input: json.usage?.input_tokens, output: json.usage?.output_tokens } };
}

export { PROVIDERS } from "./providers-meta";

/** Single entry point. The API key is used for this call only and never stored or logged. */
export async function enhance(body: EnhanceBody, apiKey: string, timeoutMs = 30000): Promise<EnhanceResult> {
  switch (body.provider) {
    case "openai": return openAiStyle("https://api.openai.com/v1", body, apiKey, timeoutMs);
    case "xai": return openAiStyle("https://api.x.ai/v1", body, apiKey, timeoutMs);
    case "anthropic": return anthropic(body, apiKey, timeoutMs);
    case "openai_compatible": {
      if (!body.baseUrl) throw new ProviderError("BAD_BASE_URL", "baseUrl is required for openai_compatible", 400);
      const u = assertSafeBaseUrl(body.baseUrl);
      return openAiStyle(u.toString(), body, apiKey, timeoutMs);
    }
  }
}
