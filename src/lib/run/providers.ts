import { maxTokens } from "./config";

type Env = Record<string, string | undefined>;
export type Fetch = typeof fetch;

export interface TextProvider { id: "groq" | "workers_ai" | "gemini"; name: string; model: string; run(prompt: string, f: Fetch, timeoutMs?: number): Promise<string> }
export interface ImageProvider { id: "workers_ai"; name: string; model: string; run(prompt: string, f: Fetch, timeoutMs?: number): Promise<string> }

/** Thrown by providers. `retryable` = try the next provider (429, 5xx, timeout, network). */
export class RunProviderError extends Error {
  constructor(public status: number, public retryable: boolean, message: string) { super(message); }
}

const SYSTEM = "You are a helpful assistant. Carry out the user's prompt directly and completely. Do not mention that you are an AI unless asked.";
const TEXT_TIMEOUT = 25_000;
const IMAGE_TIMEOUT = 30_000;

async function call(f: Fetch, url: string, init: RequestInit, timeout: number): Promise<Response> {
  let res: Response;
  try {
    res = await f(url, { ...init, signal: AbortSignal.timeout(timeout) });
  } catch (e) {
    const timedOut = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    throw new RunProviderError(timedOut ? 504 : 502, true, timedOut ? "Provider timed out" : "Provider unreachable");
  }
  if (!res.ok) {
    // 401/403 = bad or revoked key on this provider: still try the next one.
    const retryable = res.status === 429 || res.status === 408 || res.status === 401 || res.status === 403 || res.status >= 500;
    throw new RunProviderError(res.status, retryable, `Provider returned ${res.status}`);
  }
  return res;
}

function nonEmpty(s: unknown): string {
  if (typeof s !== "string" || !s.trim()) throw new RunProviderError(502, true, "Provider returned an empty response");
  return s.trim();
}

export function groq(env: Env = process.env): TextProvider | null {
  const key = env.GROQ_API_KEY?.trim();
  if (!key) return null;
  const model = env.GROQ_MODEL?.trim() || "openai/gpt-oss-20b";
  return {
    id: "groq", name: "Groq", model,
    async run(prompt, f, timeoutMs) {
      const res = await call(f, "https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, max_tokens: maxTokens(env), temperature: 0.7, messages: [{ role: "system", content: SYSTEM }, { role: "user", content: prompt }] }),
      }, Math.min(TEXT_TIMEOUT, timeoutMs ?? TEXT_TIMEOUT));
      const j = await res.json().catch(() => null);
      return nonEmpty(j?.choices?.[0]?.message?.content);
    },
  };
}

function cfCreds(env: Env) {
  const account = env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const token = env.CLOUDFLARE_API_TOKEN?.trim();
  return account && token && /^[a-f0-9]{32}$/i.test(account) ? { account, token } : null;
}

export function workersText(env: Env = process.env): TextProvider | null {
  const c = cfCreds(env);
  if (!c) return null;
  const model = env.CLOUDFLARE_TEXT_MODEL?.trim() || "@cf/meta/llama-3.1-8b-instruct-fp8-fast";
  return {
    id: "workers_ai", name: "Cloudflare Workers AI", model,
    async run(prompt, f, timeoutMs) {
      const res = await call(f, `https://api.cloudflare.com/client/v4/accounts/${c.account}/ai/run/${model}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ max_tokens: maxTokens(env), messages: [{ role: "system", content: SYSTEM }, { role: "user", content: prompt }] }),
      }, Math.min(TEXT_TIMEOUT, timeoutMs ?? TEXT_TIMEOUT));
      const j = await res.json().catch(() => null);
      return nonEmpty(j?.result?.response ?? j?.result?.choices?.[0]?.message?.content);
    },
  };
}

/** Gemini free tier: OFF unless RUN_ENABLE_GEMINI=1 (free-tier data use + under-18 terms). Never for EEA/UK/CH. */
const GEMINI_BLOCKED = new Set(["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE","IS","LI","NO","GB","CH"]);
export function gemini(env: Env = process.env, country?: string | null): TextProvider | null {
  const key = env.GEMINI_API_KEY?.trim();
  if (!key || env.RUN_ENABLE_GEMINI !== "1") return null;
  if (country && GEMINI_BLOCKED.has(country.toUpperCase())) return null;
  const model = env.GEMINI_MODEL?.trim() || "gemini-2.5-flash-lite";
  return {
    id: "gemini", name: "Google Gemini", model,
    async run(prompt, f, timeoutMs) {
      const res = await call(f, `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM }] }, contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: maxTokens(env) } }),
      }, Math.min(TEXT_TIMEOUT, timeoutMs ?? TEXT_TIMEOUT));
      const j = await res.json().catch(() => null);
      return nonEmpty(j?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join(""));
    },
  };
}

export function workersImage(env: Env = process.env): ImageProvider | null {
  const c = cfCreds(env);
  if (!c) return null;
  const model = "@cf/black-forest-labs/flux-1-schnell";
  return {
    id: "workers_ai", name: "Cloudflare Workers AI", model,
    async run(prompt, f, timeoutMs) {
      const res = await call(f, `https://api.cloudflare.com/client/v4/accounts/${c.account}/ai/run/${model}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.slice(0, 2048), steps: 4 }),
      }, Math.min(IMAGE_TIMEOUT, timeoutMs ?? IMAGE_TIMEOUT));
      const j = await res.json().catch(() => null);
      const b64 = nonEmpty(j?.result?.image);
      return `data:image/jpeg;base64,${b64}`;
    },
  };
}

/** Text chain: Groq → Workers AI → (Gemini only if explicitly enabled). Missing keys drop out. */
export function textChain(env: Env = process.env, country?: string | null): TextProvider[] {
  return [groq(env), workersText(env), gemini(env, country)].filter((p): p is TextProvider => p !== null);
}
export function imageChain(env: Env = process.env): ImageProvider[] {
  return [workersImage(env)].filter((p): p is ImageProvider => p !== null);
}

export interface ChainResult { output: string; provider: string; providerId: string; model: string; latencyMs: number }

/** Whole-chain budget so fallbacks never run past the function's maxDuration (60s). */
export const CHAIN_DEADLINE_MS = 50_000;
const MIN_ATTEMPT_MS = 3_000;

export interface ChainOptions { deadlineMs?: number; now?: () => number }

/** Try providers in order; fall back on retryable errors (429/5xx/401/403/timeout/network) within one overall deadline. */
export async function runChain(chain: (TextProvider | ImageProvider)[], prompt: string, f: Fetch = fetch, opts: ChainOptions = {}): Promise<ChainResult> {
  const now = opts.now ?? Date.now;
  const end = now() + (opts.deadlineMs ?? CHAIN_DEADLINE_MS);
  let last: RunProviderError | null = null;
  for (const p of chain) {
    const left = end - now();
    if (left < MIN_ATTEMPT_MS) { last = new RunProviderError(504, false, "Run deadline reached"); break; }
    const t0 = now();
    try {
      const output = await p.run(prompt, f, left);
      return { output, provider: p.name, providerId: p.id, model: p.model, latencyMs: now() - t0 };
    } catch (e) {
      const err = e instanceof RunProviderError ? e : new RunProviderError(502, true, "Provider error");
      last = err;
      if (!err.retryable) throw err;
    }
  }
  throw last ?? new RunProviderError(503, false, "No provider configured");
}
