import { DEVELOPER_PROMPTS } from "./developer";
import { GENERAL_PROMPTS } from "./general";
import { SOCIAL_PROMPTS } from "./social";
import type { LibraryItem } from "./types";

export * from "./types";
export { DEVELOPER_PROMPTS, GENERAL_PROMPTS, SOCIAL_PROMPTS };

export const ALL_PROMPTS: LibraryItem[] = [...DEVELOPER_PROMPTS, ...SOCIAL_PROMPTS, ...GENERAL_PROMPTS];

export function getPrompt(slug: string): LibraryItem | undefined {
  return ALL_PROMPTS.find((p) => p.slug === slug);
}

export interface LibraryQuery { q?: string; kind?: string; category?: string; target?: string; stack?: string; trend?: string; locale?: string }

/** Deterministic search: all query terms must match title/summary/tags/category/body. */
export function searchLibrary(items: LibraryItem[], query: LibraryQuery): LibraryItem[] {
  const terms = (query.q ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  return items.filter((p) => {
    if (query.kind && p.kind !== query.kind) return false;
    if (query.category && p.category !== query.category) return false;
    if (query.target && !p.targets.includes(query.target)) return false;
    if (query.stack && !(p.stacks ?? []).includes(query.stack)) return false;
    if (query.trend && p.trend?.status !== query.trend) return false;
    if (query.locale && (p.locale ?? "en") !== query.locale) return false;
    if (!terms.length) return true;
    const hay = `${p.title} ${p.summary} ${p.tags.join(" ")} ${p.category} ${(p.stacks ?? []).join(" ")} ${p.body}`.toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
}

export function categories(items: LibraryItem[]): string[] {
  return [...new Set(items.map((i) => i.category))].sort();
}
