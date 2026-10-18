import type { CSSProperties } from "react";
import { formatDate } from "./dates";
import { upcomingInstances } from "./dates";
import type { Festival } from "./types";

/** Inline CSS variables for the seasonal accent (see .festive* in globals.css). */
export function festiveStyle(f: Festival): CSSProperties {
  return { "--festive": f.theme.accent, "--festive-soft": f.theme.soft, "--festive-dark": f.theme.accentDark } as CSSProperties;
}

export interface FestivalOption { slug: string; name: string; goals: Festival["goals"]; when?: string }

/** Festival select options: upcoming first (with dates), then the rest. */
export function festivalOptions(list: Festival[], today: string): FestivalOption[] {
  const seen = new Set<string>();
  const out: FestivalOption[] = [];
  for (const i of upcomingInstances(list, today)) {
    if (seen.has(i.festival.slug)) continue;
    seen.add(i.festival.slug);
    out.push({ slug: i.festival.slug, name: i.festival.name, goals: i.festival.goals, when: formatDate(i.occurrence.primary, { weekday: false }) });
  }
  for (const f of list) if (!seen.has(f.slug)) out.push({ slug: f.slug, name: f.name, goals: f.goals });
  return out;
}
