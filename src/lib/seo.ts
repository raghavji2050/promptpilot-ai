import type { Metadata } from "next";
import { absoluteUrl, DEFAULT_OG_IMAGE, SITE } from "@/lib/site";

type PageMetaOpts = {
  title: string;
  description: string;
  path: string;
  /** "file" omits images so a route-level opengraph-image.tsx can supply them. */
  images?: "default" | "file";
};

/** Root layout appends this to string titles on child routes. */
export const TITLE_TEMPLATE = `%s | ${SITE.name}`;

/**
 * Document title under the root template.
 * A title that already ends with the brand is marked absolute so Next does not
 * append `| PromptPilot AI` a second time (see generate-metadata `title.absolute`).
 */
export function documentTitle(title: string): NonNullable<Metadata["title"]> {
  const trimmed = title.trim();
  if (trimmed === SITE.name || trimmed.endsWith(SITE.name)) return { absolute: trimmed };
  return trimmed;
}

/** Title text after the root template is applied. */
export function renderedTitle(title: Metadata["title"] | null | undefined): string {
  if (typeof title === "string") return TITLE_TEMPLATE.replace("%s", title);
  if (title && typeof title === "object") {
    if ("absolute" in title && typeof title.absolute === "string") return title.absolute;
    if ("default" in title && typeof title.default === "string") return title.default;
  }
  return "";
}

/** Unique title, description, canonical and OG/Twitter for a public page. */
export function pageMeta({ title, description, path, images = "default" }: PageMetaOpts): Metadata {
  const url = absoluteUrl(path);
  const openGraph: NonNullable<Metadata["openGraph"]> = { title, description, url };
  const twitter: NonNullable<Metadata["twitter"]> = { card: "summary_large_image", title, description };
  if (images === "default") {
    openGraph.images = [DEFAULT_OG_IMAGE];
    twitter.images = [DEFAULT_OG_IMAGE.url];
  }
  return { title: documentTitle(title), description, alternates: { canonical: path }, openGraph, twitter };
}
