import { z } from "zod";
import { siteCaps, supabaseService, tierLimits, turnstileSiteKey } from "./config";
import { imageChain, runChain, RunProviderError, textChain, type Fetch } from "./providers";
import { consumeQuota, hashIp, releaseQuota } from "./quota";
import { verifyTurnstile } from "./turnstile";
import { resolveCaller } from "./auth";
import type { RunConfig, RunErrorCode, RunResponse, RunTier } from "./types";

type Env = Record<string, string | undefined>;

export const RunSchema = z.object({
  kind: z.enum(["text", "image"]),
  prompt: z.string().trim().min(3).max(8000),
  turnstileToken: z.string().max(2048).optional(),
});

export interface RunContext { ip: string | null; country: string | null; authHeader: string | null; env?: Env; fetch?: Fetch }

const STATUS: Record<RunErrorCode, number> = { VALIDATION: 400, FORBIDDEN: 403, TURNSTILE: 403, QUOTA: 429, SITE_CAP: 429, UNAVAILABLE: 503, PROVIDER: 502, RATE_LIMITED: 429 };
export function statusFor(r: RunResponse): number { return r.ok ? 200 : STATUS[r.code]; }

function fail(code: RunErrorCode, message: string): RunResponse { return { ok: false, code, message }; }

export function providerNames(env: Env = process.env): string[] {
  return [...new Set([...textChain(env), ...imageChain(env)].map((p) => p.name))];
}

export function getRunConfig(tier: RunTier = "anon", env: Env = process.env): RunConfig {
  return {
    available: { text: textChain(env).length > 0, image: imageChain(env).length > 0 },
    turnstileSiteKey: turnstileSiteKey(env),
    limits: tierLimits(tier, env),
    tier,
    providers: providerNames(env),
  };
}

async function logCall(env: Env, f: Fetch, row: Record<string, unknown>) {
  const db = supabaseService(env);
  if (!db || env.RUN_LOG_CALLS !== "1") return;
  try {
    await f(`${db.url}/rest/v1/llm_calls`, {
      method: "POST",
      headers: { apikey: db.serviceKey, Authorization: `Bearer ${db.serviceKey}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(row),
      signal: AbortSignal.timeout(3000),
    });
  } catch { /* metadata logging is best effort */ }
}

export async function handleRun(raw: unknown, ctx: RunContext): Promise<RunResponse> {
  const env = ctx.env ?? process.env;
  const f = ctx.fetch ?? fetch;
  const parsed = RunSchema.safeParse(raw);
  if (!parsed.success) return fail("VALIDATION", "Prompt must be 3–8000 characters.");
  const { kind, prompt, turnstileToken } = parsed.data;

  const chain = kind === "text" ? textChain(env, ctx.country) : imageChain(env);
  if (chain.length === 0) return fail("UNAVAILABLE", "Free runs are coming soon. Use Try in ChatGPT/Gemini/Grok for now.");

  const ts = await verifyTurnstile(turnstileToken, ctx.ip, { env, fetch: f });
  if (!ts.ok) return fail("TURNSTILE", "Human check failed. Please try again.");

  const caller = await resolveCaller(ctx.authHeader, { env, fetch: f });
  const subject = caller.userId ? `u:${caller.userId}` : `ip:${hashIp(ctx.ip || "unknown", undefined, env)}`;
  const limit = tierLimits(caller.tier, env)[kind];
  const q = await consumeQuota(subject, kind, limit, siteCaps(env)[kind], { env, fetch: f });
  if (!q.allowed) {
    return q.reason === "SITE_CAP"
      ? fail("SITE_CAP", "Today's free runs are used up site-wide. Try again tomorrow, or use Try in ChatGPT/Gemini/Grok.")
      : fail("QUOTA", "You've used today's free runs. Try again tomorrow, or use Try in ChatGPT/Gemini/Grok.");
  }

  try {
    const r = await runChain(chain, prompt, f);
    await logCall(env, f, { user_id: caller.userId, mode: "free", provider: r.providerId, model: r.model, latency_ms: r.latencyMs, ok: true });
    return {
      ok: true, kind, provider: r.provider, model: r.model, label: `${r.provider} · ${r.model}`,
      ...(kind === "text" ? { text: r.output } : { image: r.output }),
      remaining: q.remaining, tier: caller.tier, ...(q.degraded ? { degraded: true } : {}),
    };
  } catch (e) {
    await releaseQuota(subject, kind, q.degraded, { env, fetch: f });
    const status = e instanceof RunProviderError ? e.status : 502;
    await logCall(env, f, { user_id: caller.userId, mode: "free", provider: chain[0].id, model: chain[0].model, ok: false, error_code: String(status) });
    if (status === 429) return fail("SITE_CAP", "Free AI providers are busy right now. Use Try in ChatGPT/Gemini/Grok.");
    return fail("PROVIDER", "The free AI provider couldn't answer right now. Your run wasn't counted. Try again or use Try in ChatGPT/Gemini/Grok.");
  }
}
