import { NextResponse } from "next/server";
import { providerNames } from "@/lib/run";
import { turnstileSecret, supabaseService } from "@/lib/run/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public health/status endpoint. Reports only booleans — never secret values. */
export async function GET() {
  const supabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const providers = providerNames();
  return NextResponse.json(
    {
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
    { headers: { "Cache-Control": "no-store" } },
  );
}
