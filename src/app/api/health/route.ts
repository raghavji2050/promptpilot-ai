import { NextResponse } from "next/server";
import { providerNames } from "@/lib/run";
import { turnstileSecret, supabaseService } from "@/lib/run/config";
import { isAuthorized } from "@/lib/health-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Public health endpoint: returns only `{ status: "ok" }`.
 * Config details (commit, checks) are returned only with `Authorization: Bearer <HEALTH_TOKEN>`.
 * Never returns secret values.
 */
export async function GET(req?: Request) {
  if (!isAuthorized(req?.headers.get("authorization") ?? null)) {
    return NextResponse.json({ status: "ok" }, { headers: NO_STORE });
  }
  const supabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const providers = providerNames();
  return NextResponse.json(
    {
      status: "ok",
      ok: true,
      service: "promptpilot-ai",
      time: new Date().toISOString(),
      commit: (process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 7) || null,
      checks: {
        supabase,
        runProviders: providers.length,
        runEnabled: providers.length > 0,
        turnstile: Boolean(turnstileSecret()),
        serviceRole: Boolean(supabaseService()),
      },
    },
    { headers: NO_STORE },
  );
}
