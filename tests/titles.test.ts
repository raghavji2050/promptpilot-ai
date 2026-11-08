import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Metadata } from "next";
import { metadata as aboutMeta } from "@/app/about/page";
import { metadata as extensionMeta } from "@/app/extension/page";
import { metadata as imagePromptMeta } from "@/app/image-prompt-builder/page";
import { metadata as imageReelMeta } from "@/app/image-reel-builder/page";
import { generateMetadata as packSlugMeta } from "@/app/packs/[slug]/page";
import { metadata as jobHuntingMeta } from "@/app/packs/job-hunting/page";
import { metadata as packsMeta } from "@/app/packs/page";
import { metadata as alternativeMeta } from "@/app/promptperfect-alternative/page";
import { metadata as showcaseMeta } from "@/app/showcase/page";
import { MORE_PACKS } from "@/content/more-packs";
import { renderedTitle, TITLE_TEMPLATE } from "@/lib/seo";
import { SITE } from "@/lib/site";

function brandCount(title: string): number {
  return title.split(SITE.name).length - 1;
}

function expectOneBrand(meta: Metadata, label: string) {
  const rendered = renderedTitle(meta.title);
  expect(rendered.length, label).toBeGreaterThan(0);
  expect(brandCount(rendered), `${label}: ${rendered}`).toBe(1);
  expect(rendered, label).not.toContain(`| ${SITE.name} | ${SITE.name}`);
}

describe("document titles include the brand once", () => {
  it("wires the root layout to the shared title template", () => {
    const layout = readFileSync(new URL("../src/app/layout.tsx", import.meta.url), "utf8");
    expect(layout).toContain("template: TITLE_TEMPLATE");
    expect(TITLE_TEMPLATE).toBe(`%s | ${SITE.name}`);
  });

  it("keeps /packs and /showcase from repeating the brand suffix", () => {
    expectOneBrand(packsMeta, "/packs");
    expectOneBrand(showcaseMeta, "/showcase");
    expect(renderedTitle(packsMeta.title)).toBe(`Prompt Packs: Work-safe, tested templates | ${SITE.name}`);
    expect(renderedTitle(showcaseMeta.title)).toBe(`The power of a prompt: weak vs PromptPilot | ${SITE.name}`);
  });

  it("keeps other branded public pages to a single suffix", () => {
    expectOneBrand(jobHuntingMeta, "/packs/job-hunting");
    expectOneBrand(extensionMeta, "/extension");
    expectOneBrand(imagePromptMeta, "/image-prompt-builder");
    expectOneBrand(imageReelMeta, "/image-reel-builder");
    expectOneBrand(alternativeMeta, "/promptperfect-alternative");
    expectOneBrand(aboutMeta, "/about");
    expect(renderedTitle(aboutMeta.title)).toBe(`About ${SITE.name}`);
  });

  it("keeps each pack slug title to a single brand suffix", async () => {
    for (const pack of MORE_PACKS) {
      const meta = await packSlugMeta({ params: Promise.resolve({ slug: pack.slug }) });
      expectOneBrand(meta, `/packs/${pack.slug}`);
      expect(renderedTitle(meta.title)).toBe(pack.title);
    }
  });
});
