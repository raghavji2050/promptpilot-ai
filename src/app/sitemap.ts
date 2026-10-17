import type { MetadataRoute } from "next";
import { ALL_PROMPTS } from "@/content";
import { USE_CASES } from "@/content/use-cases";
import { CATEGORIES } from "@/lib/categories";
import { STACKS, TARGETS } from "@/lib/engine";
import { absoluteUrl, SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = SITE.lastReviewed;
  const staticPaths = ["/", "/builder", "/library", "/categories", "/prompts-for", "/enhancer", "/instagram-studio", "/trending", "/agent-templates", "/developer-prompts", "/builder/classic", "/pricing", "/privacy", "/terms", "/tools"];
  return [
    ...staticPaths.map((p) => ({ url: absoluteUrl(p), lastModified, changeFrequency: (p === "/trending" ? "weekly" : "monthly") as "weekly" | "monthly", priority: p === "/" ? 1 : 0.8 })),
    ...USE_CASES.map((u) => ({ url: absoluteUrl(`/prompts-for/${u.slug}`), lastModified, changeFrequency: "monthly" as const, priority: 0.9 })),
    ...CATEGORIES.map((c) => ({ url: absoluteUrl(`/categories/${c.id}`), lastModified, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...TARGETS.map((t) => ({ url: absoluteUrl(`/builder/${t.id}`), lastModified, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...STACKS.map((s) => ({ url: absoluteUrl(`/agent-templates/${s.id}`), lastModified, changeFrequency: "monthly" as const, priority: 0.5 })),
    ...ALL_PROMPTS.map((p) => ({ url: absoluteUrl(`/p/${p.slug}`), lastModified: p.trend?.lastVerified ?? p.added ?? lastModified, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
