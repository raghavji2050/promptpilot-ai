import { describe, expect, it } from "vitest";
import { JOB_HUNTING_PACK } from "@/content/job-hunting-pack";
import { MORE_PACKS } from "@/content/more-packs";
import { PACKS } from "@/content/packs";
import { getShowcase } from "@/lib/showcase";
import {
  jobHuntingPackJsonLd,
  morePackJsonLd,
  packItemListJsonLd,
  packsIndexJsonLd,
  showcaseItemListJsonLd,
} from "@/lib/seo-jsonld";
import { absoluteUrl } from "@/lib/site";

const FORBIDDEN = /AggregateRating|aggregateRating|ratingValue|reviewCount|ratingCount|userCount|numberOfReviews|aggregateOffer/i;

describe("JSON-LD packs and showcase", () => {
  const packs = packsIndexJsonLd();
  const job = jobHuntingPackJsonLd();
  const cards = getShowcase();
  const showcase = showcaseItemListJsonLd(cards);

  it("lists every pack on the hub", () => {
    expect(packs["@type"]).toBe("ItemList");
    expect(packs.name).toBe("PromptPilot prompt packs");
    expect(packs.itemListElement).toHaveLength(PACKS.length);
    expect(packs.itemListElement.map((i) => i.name)).toEqual(PACKS.map((p) => p.title));
    expect(packs.itemListElement.map((i) => i.url)).toEqual(PACKS.map((p) => absoluteUrl(p.href)));
    expect(packs.itemListElement.map((i) => i.position)).toEqual(PACKS.map((_, i) => i + 1));
    expect(packs.itemListElement.every((i) => i["@type"] === "ListItem")).toBe(true);
  });

  it("lists job-hunting templates with fragment urls", () => {
    expect(job["@type"]).toBe("ItemList");
    expect(job.name).toBe("Job Hunting prompt pack");
    expect(job.itemListElement).toHaveLength(JOB_HUNTING_PACK.length);
    expect(job.itemListElement[0]).toEqual({
      "@type": "ListItem",
      position: 1,
      name: JOB_HUNTING_PACK[0]!.title,
      url: absoluteUrl(`/packs/job-hunting#${JOB_HUNTING_PACK[0]!.id}`),
    });
    expect(packItemListJsonLd("job-hunting", "Job Hunting prompt pack", JOB_HUNTING_PACK)).toEqual(job);
  });

  it("lists each more-pack's templates", () => {
    for (const pack of MORE_PACKS) {
      const json = morePackJsonLd(pack.slug);
      expect(json, pack.slug).toBeDefined();
      expect(json!["@type"]).toBe("ItemList");
      expect(json!.name).toBe(pack.heading);
      expect(json!.itemListElement).toHaveLength(pack.items.length);
      expect(json!.itemListElement.map((i) => i.name)).toEqual(pack.items.map((t) => t.title));
      expect(json!.itemListElement.map((i) => i.url)).toEqual(pack.items.map((t) => absoluteUrl(`/packs/${pack.slug}#${t.id}`)));
    }
    expect(morePackJsonLd("missing")).toBeUndefined();
  });

  it("lists showcase cards with fragment urls", () => {
    expect(showcase["@type"]).toBe("ItemList");
    expect(showcase.name).toBe("The power of a prompt");
    expect(showcase.itemListElement).toHaveLength(cards.length);
    expect(showcase.itemListElement.map((i) => i.name)).toEqual(cards.map((c) => c.title));
    expect(showcase.itemListElement.map((i) => i.url)).toEqual(cards.map((c) => absoluteUrl(`/showcase#${c.id}`)));
  });

  it("does not invent ratings, reviews or user counts", () => {
    const blob = JSON.stringify([packs, job, showcase, ...MORE_PACKS.map((p) => morePackJsonLd(p.slug))]);
    expect(blob).not.toMatch(FORBIDDEN);
  });
});
