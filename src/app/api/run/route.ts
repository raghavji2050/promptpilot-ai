import { NextResponse, type NextRequest } from "next/server";
import { getRunConfig, handleRun, statusFor } from "@/lib/run";
import { resolveCaller } from "@/lib/run/auth";
import { rateLimit } from "@/lib/llm/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BODY = 32 * 1024;
const NO_STORE = { "Cache-Control": "no-store" };

function clientIp(req: NextRequest): string | null {
  return req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

export async function GET(req: NextRequest) {
  const caller = await resolveCaller(req.headers.get("authorization"));
  return NextResponse.json(getRunConfig(caller.tier), { headers: NO_STORE });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && origin !== req.nextUrl.origin) return NextResponse.json({ ok: false, code: "FORBIDDEN", message: "Cross-origin requests are not allowed" }, { status: 403 });
  const ip = clientIp(req);
  const rl = rateLimit(`run:${ip}`, 6, 60_000);
  if (!rl.ok) return NextResponse.json({ ok: false, code: "RATE_LIMITED", message: "Too many requests. Try again in a minute." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  let raw: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY) return NextResponse.json({ ok: false, code: "VALIDATION", message: "Request too large" }, { status: 413 });
    raw = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false, code: "VALIDATION", message: "Body must be valid JSON" }, { status: 400 });
  }
  const result = await handleRun(raw, { ip, country: req.headers.get("x-vercel-ip-country"), authHeader: req.headers.get("authorization") });
  return NextResponse.json(result, { status: statusFor(result), headers: NO_STORE });
}
