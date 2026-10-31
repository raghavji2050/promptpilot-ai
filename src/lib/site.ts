export const SITE = {
  name: "PromptPilot AI",
  // Explicit NEXT_PUBLIC_SITE_URL wins; on Vercel fall back to the production domain it exposes automatically.
  url: (
    process.env.NEXT_PUBLIC_SITE_URL ||
    ((process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL)
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://promptpilot-ai-psi.vercel.app")
  ).replace(/\/+$/, ""),
  description:
    "Free AI prompt builder for everyone. Describe what you want in plain words and get a clear, structured prompt for ChatGPT, Claude, Gemini, Grok, Perplexity, image and video tools. No sign-up or API key needed.",
  /** Content last reviewed date (static so pages stay prerenderable). */
  lastReviewed: "2026-10-17",
};

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/builder", label: "Prompt Builder" },
  { href: "/library", label: "Explore Prompts" },
  { href: "/festivals", label: "Festivals" },
  { href: "/categories", label: "Categories" },
  { href: "/tools", label: "AI Tools" },
  // Pricing is honest: everything is free today; Premium is labelled "coming soon" with no price or pay button.
  { href: "/pricing", label: "Pricing" },
];

export function isActive(path: string | null | undefined, href: string) {
  if (!path) return false;
  return href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);
}

export function absoluteUrl(path: string) {
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Link that opens the builder pre-filled (and auto-generated) with a goal. */
export function builderHref(goal: string, opts: { sub?: string; cat?: string; platform?: string } = {}) {
  const p = new URLSearchParams({ goal });
  if (opts.cat) p.set("cat", opts.cat);
  if (opts.sub) p.set("sub", opts.sub);
  if (opts.platform) p.set("platform", opts.platform);
  return `/builder?${p.toString()}`;
}

/** Default 1200x630 social preview rendered by /api/card (wide). Used by every page that doesn't set its own image. */
export const DEFAULT_OG_IMAGE = {
  url: "/api/card?size=wide&goal=Write%20an%20Instagram%20caption%20for%20my%20Diwali%20sale&platform=chatgpt",
  width: 1200,
  height: 630,
  alt: "PromptPilot AI: a one-line idea turned into a structured AI prompt",
};

/** PLACEHOLDERS: Raghav must supply these. Rendered visibly as [BRACKETS] until filled. */
export const OWNER = {
  makerName: process.env.NEXT_PUBLIC_MAKER_NAME || "[MAKER_NAME]",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "[CONTACT_EMAIL]",
};
export const isPlaceholder = (v: string) => v.startsWith("[") && v.endsWith("]");
