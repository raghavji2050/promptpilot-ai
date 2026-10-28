import { getFestival, FESTIVALS } from "@/lib/festivals";
import { FESTIVAL_TOPICS, getTopic } from "@/content/festival-topics";
import { festivalOg, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "PromptPilot AI festival prompt guide";

export function generateStaticParams() {
  return FESTIVAL_TOPICS.map((t) => ({ slug: t.festival, topic: t.topic }));
}

export default async function Image({ params }: { params: Promise<{ slug: string; topic: string }> }) {
  const { slug, topic } = await params;
  const t = getTopic(slug, topic) ?? FESTIVAL_TOPICS[0]!;
  const f = getFestival(t.festival) ?? FESTIVALS[0]!;
  return festivalOg({ eyebrow: `${f.name} prompts`, title: t.h1, subtitle: "Expert prompts for ChatGPT, Claude, Gemini and image tools", accent: f.theme.accent, soft: f.theme.soft });
}
