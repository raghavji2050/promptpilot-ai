import { turnstileSecret } from "./config";

type Env = Record<string, string | undefined>;

/** Verify a Turnstile token server-side. Skipped (ok) when TURNSTILE_SECRET_KEY is unset (dev/tests). */
export async function verifyTurnstile(token: string | undefined, ip: string | null, opts: { env?: Env; fetch?: typeof fetch } = {}): Promise<{ ok: boolean; skipped: boolean }> {
  const secret = turnstileSecret(opts.env ?? process.env);
  if (!secret) return { ok: true, skipped: true };
  if (!token || token.length > 2048) return { ok: false, skipped: false };
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await (opts.fetch ?? fetch)("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body, signal: AbortSignal.timeout(5000) });
    const j = await res.json().catch(() => null);
    return { ok: Boolean(j?.success), skipped: false };
  } catch {
    return { ok: false, skipped: false };
  }
}
