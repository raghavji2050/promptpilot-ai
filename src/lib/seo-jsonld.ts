import { JOB_HUNTING_PACK } from "@/content/job-hunting-pack";
import { MORE_PACKS } from "@/content/more-packs";
import { PACKS } from "@/content/packs";
import { getShowcase, type ShowcaseCard } from "@/lib/showcase";
import { absoluteUrl } from "@/lib/site";

export type JsonLdListItem = { "@type": "ListItem"; position: number; name: string; url: string };

export type ItemListJsonLd = {
  "@context": "https://schema.org";
  "@type": "ItemList";
  name: string;
  itemListElement: JsonLdListItem[];
};

function listItems(entries: { name: string; url: string }[]): JsonLdListItem[] {
  return entries.map((entry, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: entry.name,
    url: entry.url,
  }));
}

/** Hub listing every prompt pack. */
export function packsIndexJsonLd(): ItemListJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "PromptPilot prompt packs",
    itemListElement: listItems(PACKS.map((p) => ({ name: p.title, url: absoluteUrl(p.href) }))),
  };
}

/** ItemList of templates in one pack (job-hunting and /packs/[slug] share this). */
export function packItemListJsonLd(slug: string, name: string, items: { id: string; title: string }[]): ItemListJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: listItems(items.map((t) => ({ name: t.title, url: absoluteUrl(`/packs/${slug}#${t.id}`) }))),
  };
}

export function jobHuntingPackJsonLd(): ItemListJsonLd {
  return packItemListJsonLd("job-hunting", "Job Hunting prompt pack", JOB_HUNTING_PACK);
}

export function morePackJsonLd(slug: string): ItemListJsonLd | undefined {
  const pack = MORE_PACKS.find((p) => p.slug === slug);
  if (!pack) return undefined;
  return packItemListJsonLd(pack.slug, pack.heading, pack.items);
}

/** Showcase weak-vs-strong cards, fragment URLs matching section ids. */
export function showcaseItemListJsonLd(cards: Pick<ShowcaseCard, "id" | "title">[] = getShowcase()): ItemListJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "The power of a prompt",
    itemListElement: listItems(cards.map((c) => ({ name: c.title, url: absoluteUrl(`/showcase#${c.id}`) }))),
  };
}
