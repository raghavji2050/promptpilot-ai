import { FESTIVALS } from "./data";
import { applyOverrides } from "./overrides";
import type { Festival } from "./types";

/**
 * Festival data with admin overrides from Supabase when available (cached for 1 hour),
 * otherwise the static file. Never throws.
 */
export async function loadFestivals(): Promise<Festival[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return FESTIVALS;
  try {
    const res = await fetch(`${url.replace(/\/+$/, "")}/rest/v1/festivals?select=*`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 3600, tags: ["festivals"] },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return FESTIVALS;
    const rows: unknown = await res.json();
    return Array.isArray(rows) ? applyOverrides(FESTIVALS, rows) : FESTIVALS;
  } catch {
    return FESTIVALS;
  }
}
