import type { Metadata } from "next";
import { absoluteUrl, DEFAULT_OG_IMAGE } from "@/lib/site";

type PageMetaOpts = {
  title: string;
  description: string;
  path: string;
  /** "file" omits images so a route-level opengraph-image.tsx can supply them. */
  images?: "default" | "file";
};

/** Unique title, description, canonical and OG/Twitter for a public page. */
export function pageMeta({ title, description, path, images = "default" }: PageMetaOpts): Metadata {
  const url = absoluteUrl(path);
  const openGraph: NonNullable<Metadata["openGraph"]> = { title, description, url };
  const twitter: NonNullable<Metadata["twitter"]> = { card: "summary_large_image", title, description };
  if (images === "default") {
    openGraph.images = [DEFAULT_OG_IMAGE];
    twitter.images = [DEFAULT_OG_IMAGE.url];
  }
  return { title, description, alternates: { canonical: path }, openGraph, twitter };
}
