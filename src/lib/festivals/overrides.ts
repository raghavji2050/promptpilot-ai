/**
 * Optional admin overrides from a Supabase `festivals` table (see supabase/festivals.sql).
 * An admin edits rows in the Supabase table editor; the app merges them over the static data.
 * If the table or env vars are missing, or the request fails, the static data is used unchanged.
 */
import { z } from "zod";
import { isISODate } from "./dates";
import type { Festival, Occurrence } from "./types";

const date = z.string().refine(isISODate, "YYYY-MM-DD").nullish();

export const OverrideRow = z.object({
  slug: z.string().min(1).max(80),
  year: z.number().int().min(2020).max(2100),
  start_date: date,
  end_date: date,
  primary_date: date,
  status: z.enum(["verified", "provisional"]).nullish(),
  note: z.string().max(500).nullish(),
  sources: z.array(z.string().max(40)).max(12).nullish(),
  last_verified: date,
  campaign_start: date,
  campaign_end: date,
  hidden: z.boolean().nullish(),
});
export type OverrideRow = z.infer<typeof OverrideRow>;

/** Pure merge: rows for unknown slugs are ignored; invalid rows are dropped. */
export function applyOverrides(festivals: Festival[], rows: unknown[]): Festival[] {
  const valid = rows.map((r) => OverrideRow.safeParse(r)).filter((r) => r.success).map((r) => r.data as OverrideRow);
  if (!valid.length) return festivals;
  return festivals.map((f) => {
    const mine = valid.filter((r) => r.slug === f.slug);
    if (!mine.length) return f;
    const occurrences = [...f.occurrences];
    for (const r of mine) {
      const idx = occurrences.findIndex((o) => o.year === r.year);
      const base: Occurrence | undefined = idx >= 0 ? occurrences[idx] : undefined;
      const fixedDate = f.fixed ? `${r.year}-${String(f.fixed.month).padStart(2, "0")}-${String(f.fixed.day).padStart(2, "0")}` : undefined;
      const primary = r.primary_date ?? base?.primary ?? r.start_date ?? fixedDate;
      if (!primary) continue; // a new occurrence needs at least one date
      const start = r.start_date ?? base?.start ?? primary;
      const end = r.end_date ?? base?.end ?? primary;
      if (!(start <= primary && primary <= end)) continue; // reject inconsistent edits
      const merged: Occurrence = {
        year: r.year,
        start,
        end,
        primary,
        status: r.status ?? base?.status ?? "provisional",
        sources: r.sources ?? base?.sources ?? [],
        lastVerified: r.last_verified ?? base?.lastVerified ?? primary,
        note: r.note ?? base?.note,
        campaignStart: r.campaign_start ?? base?.campaignStart,
        campaignEnd: r.campaign_end ?? base?.campaignEnd,
        hidden: r.hidden ?? base?.hidden,
      };
      if (idx >= 0) occurrences[idx] = merged;
      else occurrences.push(merged);
    }
    return { ...f, occurrences };
  });
}
