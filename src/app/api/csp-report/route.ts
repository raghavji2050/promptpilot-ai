import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { withLogging } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY = 8 * 1024;

const Report = z.object({
  "csp-report": z
    .object({
      "document-uri": z.string().max(2000).optional(),
      "violated-directive": z.string().max(500).optional(),
      "effective-directive": z.string().max(500).optional(),
      "blocked-uri": z.string().max(2000).optional(),
      disposition: z.string().max(50).optional(),
    })
    .passthrough(),
});

/** Receives CSP violation reports (report-only mode) and logs them as structured JSON. */
export const POST = withLogging<NextRequest>("api/csp-report", async (req, log) => {
  let raw: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY) return NextResponse.json({ ok: false, code: "TOO_LARGE" }, { status: 413 });
    raw = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false, code: "VALIDATION", message: "Body must be valid JSON" }, { status: 400 });
  }
  const parsed = Report.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ ok: false, code: "VALIDATION", message: "Not a CSP report" }, { status: 400 });
  const r = parsed.data["csp-report"];
  log.warn("csp_violation", {
    documentUri: r["document-uri"],
    directive: r["effective-directive"] ?? r["violated-directive"],
    blockedUri: r["blocked-uri"],
  });
  return new NextResponse(null, { status: 204 });
});

export function GET() {
  return NextResponse.json({ ok: false, code: "METHOD_NOT_ALLOWED" }, { status: 405 });
}
