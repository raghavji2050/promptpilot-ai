import { toShareParams, type UniversalInput } from "@/lib/engine";

/** Social card sizes rendered by /api/card. */
export const CARD_SIZES = {
  square: { width: 1080, height: 1080, label: "Square post", hint: "1080×1080 · Instagram, LinkedIn, X" },
  story: { width: 1080, height: 1920, label: "Story", hint: "1080×1920 · Stories, Status, Reels cover" },
  wide: { width: 1200, height: 630, label: "Link preview", hint: "1200×630 · Facebook, LinkedIn, X links" },
} as const;
export type CardSize = keyof typeof CARD_SIZES;
export const isCardSize = (s: unknown): s is CardSize => typeof s === "string" && s in CARD_SIZES;

export type ShareChannel = "x" | "linkedin" | "whatsapp" | "facebook" | "webshare" | "copy" | "download";
export const SHARE_NETWORKS: { id: Extract<ShareChannel, "x" | "linkedin" | "whatsapp" | "facebook">; label: string }[] = [
  { id: "x", label: "X" }, { id: "linkedin", label: "LinkedIn" }, { id: "whatsapp", label: "WhatsApp" }, { id: "facebook", label: "Facebook" },
];

/** UTM tags for a shared link: source = channel, medium = social, campaign = festival_share | prompt_share, content = festival/category. */
export function utmParams(input: UniversalInput, channel: ShareChannel): URLSearchParams {
  const fest = input.extra?.festival;
  return new URLSearchParams({
    utm_source: channel,
    utm_medium: channel === "copy" ? "referral" : "social",
    utm_campaign: fest ? "festival_share" : "prompt_share",
    utm_content: (fest && fest !== "custom" ? fest : input.categoryId || "general").replace(/[^a-z0-9-]/gi, "").slice(0, 40) || "general",
  });
}

/** Link that rebuilds this exact prompt in the builder, with UTM tags. */
export function sharedLink(origin: string, input: UniversalInput, channel: ShareChannel): string {
  const p = toShareParams(input);
  for (const [k, v] of utmParams(input, channel)) p.set(k, v);
  return `${origin.replace(/\/$/, "")}/builder?${p.toString()}`;
}

/** Image URL for the Before vs After card (relative unless an origin is given). */
export function cardUrl(input: UniversalInput, size: CardSize, opts: { download?: boolean; origin?: string } = {}): string {
  const p = toShareParams(input);
  p.set("size", size);
  if (opts.download) p.set("dl", "1");
  return `${opts.origin?.replace(/\/$/, "") ?? ""}/api/card?${p.toString()}`;
}

/** Suggested share text: factual, no claims about results or popularity. */
export function shareText(input: UniversalInput, festivalName?: string): string {
  return festivalName
    ? `I turned a one-line idea into a detailed ${festivalName} AI prompt with PromptPilot AI. Before vs after:`
    : "I turned a one-line idea into a structured AI prompt with PromptPilot AI. Before vs after:";
}

/** Official web share-intent URLs (they open each network's own compose screen; nothing is posted automatically). */
export function intentUrl(network: "x" | "linkedin" | "whatsapp" | "facebook", url: string, text: string): string {
  const u = encodeURIComponent(url), t = encodeURIComponent(text);
  switch (network) {
    case "x": return `https://twitter.com/intent/tweet?text=${t}&url=${u}`;
    case "linkedin": return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
    case "whatsapp": return `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
    case "facebook": return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
  }
}

/** Trim a line to n characters with an ellipsis. */
export const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
