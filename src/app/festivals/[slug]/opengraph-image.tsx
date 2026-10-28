import { FESTIVALS, getFestival } from "@/lib/festivals";
import { festivalOg, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "PromptPilot AI festival prompt studio";

export function generateStaticParams() {
  return FESTIVALS.map((f) => ({ slug: f.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const f = getFestival(slug) ?? FESTIVALS[0]!;
  return festivalOg({ eyebrow: "Festival prompt studio", title: `${f.name} AI prompts`, subtitle: "Greetings · Reels · Posts · Posters · Business campaigns", accent: f.theme.accent, soft: f.theme.soft });
}
