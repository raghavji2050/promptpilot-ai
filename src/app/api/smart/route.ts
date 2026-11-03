import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { checkLimit, clientIp, limitHeaders, tooManyMessage } from "@/lib/ratelimit";
import { improveText } from "@/lib/engine";
import { smartImprove } from "@/lib/smart";
import { withLogging } from "@/lib/log";

const Body = z.object({ input: z.string().trim().min(1).max(8000), target: z.string().trim().max(40).regex(/^[a-z0-9-]*$/).optional() });

export const POST = withLogging<NextRequest>("api/smart", async (req) => {
  const origin = req.headers.get("origin");
  if (origin && origin !== req.nextUrl.origin && !/^chrome-extension:\/\/[a-p]{32}$/.test(origin)) return NextResponse.json({ error: { code: "FORBIDDEN", message: "Cross-origin requests are not allowed" } }, { status: 403 });
  let parsed;
  try { parsed = Body.safeParse(JSON.parse(await req.text())); } catch { parsed = null; }
  if (!parsed?.success) return NextResponse.json({ error: { code: "VALIDATION", message: "Send { input, target? }" } }, { status: 400 });
  const { input, target = "chatgpt" } = parsed.data;
  const rl = await checkLimit("enhance", clientIp(req.headers));
  if (!rl.ok) {
    // Rate limited: still useful, deterministic answer.
    return NextResponse.json({ text: improveText(input, target), source: "fallback", note: tooManyMessage(rl) }, { headers: { ...limitHeaders(rl), "Cache-Control": "no-store" } });
  }
  const r = await smartImprove(input, target);
  return NextResponse.json(r, { headers: { ...limitHeaders(rl), "Cache-Control": "no-store" } });
});

export function GET() { return NextResponse.json({ error: { code: "METHOD_NOT_ALLOWED", message: "Use POST" } }, { status: 405 }); }
