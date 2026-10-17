import { NextResponse, type NextRequest } from "next/server";
import { enhance, EnhanceSchema, ProviderError } from "@/lib/llm";
import { rateLimit } from "@/lib/llm/ratelimit";

const MAX_BODY = 64 * 1024;

function err(status: number, code: string, message: string, headers?: Record<string, string>) {
  return NextResponse.json({ error: { code, message } }, { status, headers });
}

export async function POST(req: NextRequest) {
  // CSRF-style origin check for browser requests
  const origin = req.headers.get("origin");
  if (origin && origin !== req.nextUrl.origin) return err(403, "FORBIDDEN", "Cross-origin requests are not allowed");

  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = rateLimit(`enhance:${ip}`, 10, 60_000);
  if (!rl.ok) return err(429, "RATE_LIMITED", "Too many requests. Try again shortly.", { "Retry-After": String(rl.retryAfter) });

  const len = Number(req.headers.get("content-length") || 0);
  if (len > MAX_BODY) return err(413, "TOO_LARGE", "Request body too large");

  const key = req.headers.get("x-llm-key")?.trim() ?? "";
  if (!key || key.length > 300 || /\s/.test(key)) return err(400, "VALIDATION", "A valid API key header (x-llm-key) is required. Hosted enhancement is not enabled.");

  let raw: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY) return err(413, "TOO_LARGE", "Request body too large");
    raw = JSON.parse(text);
  } catch {
    return err(400, "VALIDATION", "Body must be valid JSON");
  }
  const parsed = EnhanceSchema.safeParse(raw);
  if (!parsed.success) return err(400, "VALIDATION", parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));

  try {
    const result = await enhance(parsed.data, key);
    return NextResponse.json({ text: result.text, latencyMs: result.latencyMs, usage: result.usage }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof ProviderError) return err(e.status, e.code, e.message);
    return err(500, "INTERNAL", "Unexpected error");
  }
}

export function GET() {
  return err(405, "METHOD_NOT_ALLOWED", "Use POST");
}
