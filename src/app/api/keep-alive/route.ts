import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { withLogging } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lightweight Supabase keep-alive for the free-plan project (auto-pauses after ~7 idle days).
 * Vercel Cron calls this daily. If CRON_SECRET is set, requires Authorization: Bearer <secret>.
 */
export const GET = withLogging<NextRequest>("api/keep-alive", async (req, log) => {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const started = Date.now();
  // Tiny public read — hits Postgres so the free project stays awake.
  const { error, count } = await supabase
    .from("library_items")
    .select("id", { count: "exact", head: true })
    .limit(1);

  const latencyMs = Date.now() - started;

  if (error) {
    log.error("keep_alive_failed", { latencyMs });
    return NextResponse.json(
      { ok: false, error: error.message, latencyMs },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { ok: true, pinged: "library_items", count: count ?? 0, latencyMs },
    { headers: { "Cache-Control": "no-store" } },
  );
});
