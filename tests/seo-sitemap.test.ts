import { describe, expect, it } from "vitest";
import sitemap, { SITEMAP_STATIC_PATHS } from "@/app/sitemap";
import { pageMeta } from "@/lib/seo";
import { absoluteUrl, SITE } from "@/lib/site";

const REQUIRED = [
  "/",
  "/pricing",
  "/festivals",
  "/showcase",
  "/packs",
  "/packs/job-hunting",
  "/packs/students",
  "/packs/small-business",
  "/packs/freelancers",
  "/packs/app-builder",
  "/image-reel-builder",
  "/image-prompt-builder",
  "/promptperfect-alternative",
  "/extension",
  "/about",
  "/contact",
] as const;

describe("sitemap", () => {
  const entries = sitemap();
  const urls = entries.map((e) => e.url);

  it("includes every exported static public path", () => {
    for (const path of SITEMAP_STATIC_PATHS) {
      expect(urls, path).toContain(absoluteUrl(path));
    }
  });

  it("includes the required public routes", () => {
    for (const path of REQUIRED) {
      expect(SITEMAP_STATIC_PATHS, path).toContain(path);
      expect(urls, path).toContain(absoluteUrl(path));
    }
  });

  it("does not list login or dashboard", () => {
    expect(urls.some((u) => u.endsWith("/login") || u.includes("/login?"))).toBe(false);
    expect(urls.some((u) => u.endsWith("/dashboard") || u.includes("/dashboard?"))).toBe(false);
    expect(SITEMAP_STATIC_PATHS).not.toContain("/login");
    expect(SITEMAP_STATIC_PATHS).not.toContain("/dashboard");
  });

  it("uses the current lastReviewed date as lastmod for static paths", () => {
    expect(SITE.lastReviewed).toBe("2026-11-08");
    const home = entries.find((e) => e.url === absoluteUrl("/"));
    expect(home?.lastModified).toBe("2026-11-08");
  });
});

describe("pageMeta", () => {
  it("sets title, description, canonical and OG url/images", () => {
    const meta = pageMeta({ title: "About PromptPilot AI", description: "Who makes it.", path: "/about" });
    expect(meta.title).toBe("About PromptPilot AI");
    expect(meta.description).toBe("Who makes it.");
    expect(meta.alternates).toEqual({ canonical: "/about" });
    expect(meta.openGraph?.url).toBe(absoluteUrl("/about"));
    expect(meta.openGraph?.title).toBe("About PromptPilot AI");
    expect(meta.openGraph?.description).toBe("Who makes it.");
    expect(meta.openGraph?.images).toBeDefined();
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("omits images when a file-based OG image will supply them", () => {
    const meta = pageMeta({ title: "Packs", description: "Packs.", path: "/packs", images: "file" });
    expect(meta.alternates).toEqual({ canonical: "/packs" });
    expect(meta.openGraph?.url).toBe(absoluteUrl("/packs"));
    expect(meta.openGraph?.images).toBeUndefined();
    expect(meta.twitter?.images).toBeUndefined();
  });
});
