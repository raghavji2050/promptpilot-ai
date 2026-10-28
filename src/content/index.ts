import { DEVELOPER_PROMPTS } from "./developer";
import { GENERAL_PROMPTS } from "./general";
import { SOCIAL_PROMPTS } from "./social";
import { UNIVERSAL_PROMPTS } from "./universal";
import type { LibraryItem } from "./types";
import type { CategoryId } from "@/lib/categories/types";

export * from "./types";
export { DEVELOPER_PROMPTS, GENERAL_PROMPTS, SOCIAL_PROMPTS, UNIVERSAL_PROMPTS };

const LEGACY_ADDED = "2026-10-16";

/** Category mapping for prompts written before the goal-based registry existed. */
const LEGACY: Record<string, Partial<LibraryItem>> = {
  "perplexity-sourced-research": { cat: "data", sub: "research-workflow", audience: "Researchers, students and analysts", useCase: "Sourced research", outputType: "Report" },
  "claude-document-analysis": { cat: "data", sub: "document-analysis", audience: "Professionals reading long documents", useCase: "Answer questions from a document", outputType: "Answers with quotes" },
  "chatgpt-cold-email": { cat: "business", sub: "sales-scripts", audience: "Freelancers and small businesses", useCase: "Outreach email", outputType: "Email" },
  "grok-x-thread": { cat: "social", sub: "x-threads", audience: "Creators and founders on X", useCase: "Write a thread", outputType: "Thread" },
  "gemini-study-plan": { cat: "education", sub: "study-plan", audience: "Students and self-learners", useCase: "Study plan", outputType: "Plan" },
  "meeting-notes-summary": { cat: "writing", sub: "summarization", audience: "Teams and managers", useCase: "Summarise meetings", outputType: "Summary" },
  "resume-bullets": { cat: "career", sub: "resume", audience: "Job seekers", useCase: "Improve a resume", outputType: "Rewrite" },
};

function outputFromCategory(c: string): string {
  if (/image|photo/i.test(c)) return "Image prompt";
  if (/video/i.test(c)) return "Video prompt";
  return "Instructions";
}

/** Fills goal-based metadata for older items so every prompt can be filtered the same way. */
export function enrich(p: LibraryItem): LibraryItem {
  const legacy = LEGACY[p.slug] ?? {};
  const base: Partial<LibraryItem> = {};
  if (p.kind === "developer") Object.assign(base, { cat: "coding", sub: p.stacks?.length ? "build-app" : "coding-assistant", audience: "Developers using AI coding tools", useCase: p.category, outputType: "Agent task" });
  else if (p.kind === "social") Object.assign(base, { cat: "design", sub: p.requiresPhoto ? "photo-edit" : /video/i.test(p.category) ? "video-generation" : "image-generation", audience: "Instagram and social media users", useCase: p.requiresPhoto ? "Photo edits for social media" : p.category, outputType: outputFromCategory(p.category) });
  else if (/image/i.test(p.category)) Object.assign(base, { cat: "design", sub: "image-generation", audience: "Designers and marketers", useCase: p.category, outputType: "Image prompt" });
  else if (/video/i.test(p.category)) Object.assign(base, { cat: "design", sub: "video-generation", audience: "Creators and marketers", useCase: p.category, outputType: "Video prompt" });
  return { added: LEGACY_ADDED, premium: false, ...base, ...legacy, ...p, cat: p.cat ?? (legacy.cat as CategoryId) ?? (base.cat as CategoryId) ?? "writing" };
}

export const ALL_PROMPTS: LibraryItem[] = [...UNIVERSAL_PROMPTS, ...GENERAL_PROMPTS, ...SOCIAL_PROMPTS, ...DEVELOPER_PROMPTS].map(enrich);

export function getPrompt(slug: string): LibraryItem | undefined {
  return ALL_PROMPTS.find((p) => p.slug === slug);
}

/** Bracketed placeholders like [your audience] are the inputs a user must supply. */
export function requiredInputs(body: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of body.matchAll(/\[([^\[\]\n]{2,60})\]/g)) {
    const k = (m[1] ?? "").trim();
    if (/^(source needed|add metric|needed)$/i.test(k)) continue;
    if (!seen.has(k.toLowerCase())) { seen.add(k.toLowerCase()); out.push(k); }
  }
  return out;
}

export interface LibraryQuery {
  q?: string; kind?: string; category?: string; cat?: string; sub?: string; target?: string; stack?: string; trend?: string; locale?: string;
  outputType?: string; tier?: "" | "free" | "premium"; sort?: "" | "newest" | "az";
}

/** Deterministic search: all query terms must match title/summary/tags/category/body. */
export function searchLibrary(items: LibraryItem[], query: LibraryQuery): LibraryItem[] {
  const terms = (query.q ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  const out = items.filter((p) => {
    if (query.kind && p.kind !== query.kind) return false;
    if (query.category && p.category !== query.category) return false;
    if (query.cat && p.cat !== query.cat) return false;
    if (query.sub && p.sub !== query.sub) return false;
    if (query.target && !p.targets.includes(query.target)) return false;
    if (query.stack && !(p.stacks ?? []).includes(query.stack)) return false;
    if (query.trend && p.trend?.status !== query.trend) return false;
    if (query.locale && (p.locale ?? "en") !== query.locale) return false;
    if (query.outputType && p.outputType !== query.outputType) return false;
    if (query.tier === "premium" && !p.premium) return false;
    if (query.tier === "free" && p.premium) return false;
    if (!terms.length) return true;
    const hay = `${p.title} ${p.summary} ${p.tags.join(" ")} ${p.category} ${p.useCase ?? ""} ${p.audience ?? ""} ${(p.stacks ?? []).join(" ")} ${p.body}`.toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
  if (query.sort === "newest") return [...out].sort((a, b) => (b.added ?? "").localeCompare(a.added ?? "") || items.indexOf(a) - items.indexOf(b));
  if (query.sort === "az") return [...out].sort((a, b) => a.title.localeCompare(b.title));
  return out;
}

export function categories(items: LibraryItem[]): string[] {
  return [...new Set(items.map((i) => i.category))].sort();
}

export function outputTypes(items: LibraryItem[]): string[] {
  return [...new Set(items.map((i) => i.outputType).filter(Boolean) as string[])].sort();
}

export function promptsForCategory(cat: CategoryId): LibraryItem[] {
  return ALL_PROMPTS.filter((p) => p.cat === cat);
}
