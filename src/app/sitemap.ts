import type { MetadataRoute } from "next";
import { ALL_PROMPTS } from "@/content";
import { STACKS, TARGETS } from "@/lib/engine";
import { absoluteUrl, SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = SITE.lastReviewed;
  const staticPaths = ["/", "/builder", "/agent-templates", "/developer-prompts", "/instagram-studio", "/trending", "/enhancer", "/library", "/pricing", "/privacy", "/terms"];
  return [
    ...staticPaths.map((p) => ({ url: absoluteUrl(p), lastModified, changeFrequency: (p === "/trending" ? "weekly" : "monthly") as "weekly" | "monthly", priority: p === "/" ? 1 : 0.8 })),
    ...TARGETS.map((t) => ({ url: absoluteUrl(`/builder/${t.id}`), lastModified, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...STACKS.map((s) => ({ url: absoluteUrl(`/agent-templates/${s.id}`), lastModified, changeFrequency: "monthly" as const, priority: 0.9 })),
    ...ALL_PROMPTS.map((p) => ({ url: absoluteUrl(`/p/${p.slug}`), lastModified: p.trend?.lastVerified ?? lastModified, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
