/** Deterministic Image & Reel prompt builder for Indian use cases. No API calls. */
export const USE_CASES = {
  "festival-poster": { label: "Festival poster", kind: "image", ar: "4:5", scene: "a vibrant Indian festival poster", details: "diyas, marigold garlands, rangoli patterns, warm festive lighting", text: "a clear headline area for the festival greeting" },
  "shop-ad": { label: "Shop ad", kind: "image", ar: "1:1", scene: "a clean promotional ad for a local Indian shop", details: "the product in sharp focus, a tidy shop counter background, bright natural light", text: "space for the shop name, offer and phone number" },
  "whatsapp-status": { label: "WhatsApp status", kind: "image", ar: "9:16", scene: "a vertical WhatsApp status image", details: "bold simple composition readable on a phone screen, soft gradient background", text: "a short message in large readable type" },
  "shaadi-invite": { label: "Shaadi invite", kind: "image", ar: "2:3", scene: "an elegant Indian wedding invitation card", details: "gold foil ornaments, mandap and floral motifs, rich maroon and gold palette", text: "space for couple names, date and venue" },
  "instagram-reel": { label: "Instagram reel / Short", kind: "video", ar: "9:16", scene: "a short vertical Instagram reel", details: "quick cuts, handheld energy, natural Indian street or home setting", text: "on-screen caption at the start" },
} as const;
export type UseCase = keyof typeof USE_CASES;

export const MODELS = {
  midjourney: { label: "Midjourney", format: "flags" },
  gemini: { label: "Gemini / Nano Banana", format: "plain" },
  dalle: { label: "DALL·E / ChatGPT", format: "plain" },
  video: { label: "Sora / Veo / Runway", format: "shots" },
} as const;
export type Model = keyof typeof MODELS;

export type ImageReelInput = { useCase: UseCase; model: Model; subject: string; style?: string; textOnImage?: string };

const HINGLISH: [RegExp, string][] = [
  [/\bdukaan\b|\bdukan\b/gi, "shop"], [/\bshaadi\b/gi, "wedding"], [/\bmithai\b/gi, "Indian sweets"],
  [/\bkapde\b/gi, "clothes"], [/\bsasta\b|\bsaste\b/gi, "affordable"], [/\bnaya\b|\bnayi\b/gi, "new"],
  [/\bmera\b|\bmeri\b|\bmere\b/gi, "my"], [/\bke liye\b/gi, "for"], [/\bka\b|\bki\b|\bke\b/gi, "of"],
  [/\baur\b/gi, "and"], [/\bdulhan\b/gi, "bride"], [/\bdulha\b/gi, "groom"], [/\bbanao\b|\bbana do\b/gi, ""],
];
/** Light Hinglish → English normalisation for common words. */
export function normaliseHinglish(s: string): string {
  let out = s;
  for (const [re, en] of HINGLISH) out = out.replace(re, en);
  return out.replace(/\s+/g, " ").trim();
}

export function buildImageReelPrompt(input: ImageReelInput): string {
  const uc = USE_CASES[input.useCase];
  const subject = normaliseHinglish(input.subject || "") || "a festive celebration";
  const style = normaliseHinglish(input.style || "") || "photorealistic, high detail";
  const txt = input.textOnImage?.trim();
  const textLine = txt ? `the text "${txt}" written clearly` : uc.text;
  const fmt = MODELS[input.model].format;

  if (fmt === "shots") {
    return [
      `Create ${uc.kind === "video" ? uc.scene : `a 10-second vertical video version of ${uc.scene}`} about ${subject}. Aspect ratio 9:16, about 10 seconds, ${style}.`,
      `Shot 1 (0-3s): establishing wide shot of ${subject}, ${uc.details}.`,
      `Shot 2 (3-6s): medium close-up, slow push-in on the main subject, natural motion.`,
      `Shot 3 (6-10s): close-up hero shot, ${textLine} appears on screen.`,
      `Camera: smooth handheld, no jump in identity or faces between shots. Audio: upbeat Indian background music, no dialogue.`,
    ].join("\n");
  }
  if (fmt === "flags") {
    return `${uc.scene}, ${subject}, ${uc.details}, ${textLine}, ${style} --ar ${uc.ar} --v 7 --style raw`;
  }
  const extra = input.model === "dalle" ? " Make it look natural, not cartoonish, unless the style says so." : " Keep it culturally accurate for India.";
  return `Create ${uc.scene} featuring ${subject}. Include ${uc.details}. Leave ${textLine}. Style: ${style}. Aspect ratio ${uc.ar}.${extra}`;
}
