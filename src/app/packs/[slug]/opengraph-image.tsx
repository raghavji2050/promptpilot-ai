import { MORE_PACKS } from "@/content/more-packs";
import { festivalOg, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "PromptPilot AI prompt pack";

export function generateStaticParams() { return MORE_PACKS.map((p) => ({ slug: p.slug })); }

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = MORE_PACKS.find((x) => x.slug === slug) ?? MORE_PACKS[0]!;
  return festivalOg({ eyebrow: "Free prompt pack · India", title: p.heading, subtitle: p.items.map((t) => t.title).slice(0, 3).join(" · "), accent: "#047857", soft: "#ecfdf5" });
}
