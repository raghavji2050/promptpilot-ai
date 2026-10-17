export const SITE = {
  name: "PromptPilot AI",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, ""),
  description:
    "Free deterministic prompt builder for ChatGPT, Claude, Gemini, Grok, Perplexity, image and video models, plus AGENTS.md, CLAUDE.md and Cursor rules generators for Laravel, Node.js and Next.js.",
  /** Content last reviewed date (static so pages stay prerenderable). */
  lastReviewed: "2026-10-17",
};

export const NAV = [
  { href: "/builder", label: "Builder" },
  { href: "/agent-templates", label: "Agent Templates" },
  { href: "/developer-prompts", label: "Developer Prompts" },
  { href: "/instagram-studio", label: "Instagram Studio" },
  { href: "/trending", label: "Trending" },
  { href: "/enhancer", label: "Enhancer" },
  { href: "/library", label: "Library" },
  { href: "/pricing", label: "Pricing" },
];

export function absoluteUrl(path: string) {
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}
