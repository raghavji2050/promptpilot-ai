import { afterEach, describe, expect, it, vi } from "vitest";
import { FESTIVALS, getFestival } from "@/lib/festivals";
import { loadFestivals } from "@/lib/festivals/server";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("loadFestivals (Supabase override with static fallback)", () => {
  it("uses static data when env vars are missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const f = vi.fn(); vi.stubGlobal("fetch", f);
    expect(await loadFestivals()).toBe(FESTIVALS);
    expect(f).not.toHaveBeenCalled();
  });
  it("falls back when the table is missing (404) or the request fails", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 404 })));
    expect(await loadFestivals()).toBe(FESTIVALS);
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network"); }));
    expect(await loadFestivals()).toBe(FESTIVALS);
  });
  it("merges rows from the table", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co/");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    const f = vi.fn(async () => Response.json([{ slug: "govardhan-puja", year: 2026, primary_date: "2026-11-10", start_date: "2026-11-10", end_date: "2026-11-10", status: "verified" }]));
    vi.stubGlobal("fetch", f);
    const out = await loadFestivals();
    expect(getFestival("govardhan-puja", out)!.occurrences[0]).toMatchObject({ primary: "2026-11-10", status: "verified" });
    expect(String((f.mock.calls[0] as unknown[])[0])).toBe("https://example.supabase.co/rest/v1/festivals?select=*");
  });
});
