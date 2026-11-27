import "@/lib/zod-config";
import { z } from "zod";
import { deterministicTestDrive, outputSignals, type DeterministicTestDrive } from "@/lib/engine/test-drive";
import { siteCaps, tierLimits, turnstileSiteKey } from "./config";
import { RunProviderError, textChain, type Fetch, type TextProvider } from "./providers";
import { consumeQuota, hashIp, releaseQuota } from "./quota";
import { verifyTurnstile } from "./turnstile";
import { resolveCaller } from "./auth";
import type { RunErrorCode, RunTier } from "./types";

type Env = Record<string, string | undefined>;

export const TestDriveSchema = z.object({
  rawIdea: z.string().trim().min(3).max(2000),
  improvedPrompt: z.string().trim().min(3).max(8000).optional(),
  target: z.string().trim().max(40).optional(),
  turnstileToken: z.string().max(2048).optional(),
});

/** At most 3 free providers, each answering both prompts. */
export const TEST_DRIVE_MAX_MODELS = 3;
/** Per-call budget: one slow provider must never hold up the others (route maxDuration is 60s). */
export const TEST_DRIVE_CALL_TIMEOUT_MS = 15_000;

export interface TestDriveModelResult {
  id: TextProvider["id"];
  name: string;
  model: string;
  rawOutput?: string;
  improvedOutput?: string;
  rawMs?: number;
  improvedMs?: number;
  error?: string;
  signals: { rawWords: number; improvedWords: number; hasStructure: boolean; hasPlaceholders: boolean; rawHasStructure: boolean };
}

export type TestDriveLive = "off" | "ok" | "partial" | "failed";

export type TestDriveResponse =
  | (DeterministicTestDrive & {
      ok: true;
      providersAvailable: string[];
      models: TestDriveModelResult[];
      live: TestDriveLive;
      remaining: number | null;
      tier: RunTier;
    })
  | { ok: false; code: RunErrorCode; message: string };

export interface TestDriveConfig { providers: { id: string; name: string; model: string }[]; turnstileSiteKey: string | null; limit: number; tier: RunTier }

export interface TestDriveContext { ip: string | null; country: string | null; authHeader: string | null; env?: Env; fetch?: Fetch; now?: () => number }

const STATUS: Record<RunErrorCode, number> = { VALIDATION: 400, FORBIDDEN: 403, TURNSTILE: 403, QUOTA: 429, SITE_CAP: 429, UNAVAILABLE: 503, PROVIDER: 502, RATE_LIMITED: 429 };
export function testDriveStatus(r: TestDriveResponse): number { return r.ok ? 200 : STATUS[r.code]; }

function fail(code: RunErrorCode, message: string): TestDriveResponse { return { ok: false, code, message }; }

export function testDriveChain(env: Env = process.env, country?: string | null): TextProvider[] {
  return textChain(env, country).slice(0, TEST_DRIVE_MAX_MODELS);
}

export function getTestDriveConfig(tier: RunTier = "anon", env: Env = process.env, country?: string | null): TestDriveConfig {
  return {
    providers: testDriveChain(env, country).map((p) => ({ id: p.id, name: p.name, model: p.model })),
    turnstileSiteKey: turnstileSiteKey(env),
    limit: tierLimits(tier, env).text,
    tier,
  };
}

function errorText(e: unknown): string {
  if (e instanceof RunProviderError) {
    if (e.status === 504) return "Timed out";
    if (e.status === 429) return "Busy (free limit reached)";
    if (e.status === 401 || e.status === 403) return "Not available right now";
    return "Couldn't answer right now";
  }
  return "Couldn't answer right now";
}

async function timed(p: TextProvider, prompt: string, f: Fetch, now: () => number): Promise<{ text: string; ms: number }> {
  const t0 = now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  // Belt and braces: providers already abort at the timeout, this also covers a provider that ignores it.
  const guard = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new RunProviderError(504, true, "Provider timed out")), TEST_DRIVE_CALL_TIMEOUT_MS + 500); });
  try {
    const text = await Promise.race([p.run(prompt, f, TEST_DRIVE_CALL_TIMEOUT_MS), guard]);
    return { text, ms: Math.max(0, Math.round(now() - t0)) };
  } finally {
    clearTimeout(timer);
  }
}

/** Run both prompts on every provider in parallel. A failing provider only marks its own card. */
export async function runSideBySide(chain: TextProvider[], rawIdea: string, improvedPrompt: string, f: Fetch, now: () => number = Date.now): Promise<TestDriveModelResult[]> {
  const settled = await Promise.allSettled(chain.flatMap((p) => [timed(p, rawIdea, f, now), timed(p, improvedPrompt, f, now)]));
  type Settled = PromiseSettledResult<{ text: string; ms: number }> | undefined;
  const ok = (r: Settled) => (r?.status === "fulfilled" ? r.value : undefined);
  const err = (label: string, r: Settled) => (r?.status === "rejected" ? `${label}: ${errorText(r.reason)}` : r ? null : `${label}: ${errorText(null)}`);
  return chain.map((p, i) => {
    const raw = ok(settled[i * 2]);
    const imp = ok(settled[i * 2 + 1]);
    const r = outputSignals(raw?.text);
    const m = outputSignals(imp?.text);
    const errs = [err("Raw", settled[i * 2]), err("Improved", settled[i * 2 + 1])].filter(Boolean);
    return {
      id: p.id, name: p.name, model: p.model,
      ...(raw ? { rawOutput: raw.text, rawMs: raw.ms } : {}),
      ...(imp ? { improvedOutput: imp.text, improvedMs: imp.ms } : {}),
      ...(errs.length ? { error: errs.join(" · ") } : {}),
      signals: { rawWords: r.words, improvedWords: m.words, hasStructure: m.hasStructure, hasPlaceholders: m.hasPlaceholders, rawHasStructure: r.hasStructure },
    };
  });
}

export async function handleTestDrive(input: unknown, ctx: TestDriveContext): Promise<TestDriveResponse> {
  const env = ctx.env ?? process.env;
  const f = ctx.fetch ?? fetch;
  const parsed = TestDriveSchema.safeParse(input);
  if (!parsed.success) return fail("VALIDATION", "Raw idea must be 3–2000 characters (improved prompt up to 8000).");
  const { rawIdea, improvedPrompt, target, turnstileToken } = parsed.data;

  const base = deterministicTestDrive(rawIdea, improvedPrompt, target);
  const chain = testDriveChain(env, ctx.country);
  const providersAvailable = chain.map((p) => p.name);
  // No free provider configured: the honest deterministic comparison only. Never fake model outputs.
  if (chain.length === 0) return { ok: true, ...base, providersAvailable: [], models: [], live: "off", remaining: null, tier: "anon" };

  const ts = await verifyTurnstile(turnstileToken, ctx.ip, { env, fetch: f });
  if (!ts.ok) return fail("TURNSTILE", "Human check failed. Please try again.");

  const caller = await resolveCaller(ctx.authHeader, { env, fetch: f });
  const subject = caller.userId ? `u:${caller.userId}` : `ip:${hashIp(ctx.ip || "unknown", undefined, env)}`;
  const q = await consumeQuota(subject, "text", tierLimits(caller.tier, env).text, siteCaps(env).text, { env, fetch: f });
  if (!q.allowed) {
    return q.reason === "SITE_CAP"
      ? fail("SITE_CAP", "Today's free runs are used up site-wide. Try again tomorrow, or use Try in ChatGPT/Claude/Grok.")
      : fail("QUOTA", "You've used today's free runs. Try again tomorrow, or use Try in ChatGPT/Claude/Grok.");
  }

  const models = await runSideBySide(chain, base.rawIdea, base.improvedPrompt, f, ctx.now);
  const full = models.filter((m) => m.rawOutput !== undefined && m.improvedOutput !== undefined).length;
  const any = models.some((m) => m.rawOutput !== undefined || m.improvedOutput !== undefined);
  if (!any) await releaseQuota(subject, "text", q.degraded, { env, fetch: f });
  const live: TestDriveLive = !any ? "failed" : full === models.length ? "ok" : "partial";
  return { ok: true, ...base, providersAvailable, models, live, remaining: any ? q.remaining : q.remaining + 1, tier: caller.tier };
}
