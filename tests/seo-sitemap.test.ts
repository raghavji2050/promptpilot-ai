import { describe, expect, it } from "vitest";
import sitemap, { SITEMAP_STATIC_PATHS } from "@/app/sitemap";
import { pageMeta, renderedTitle, TITLE_TEMPLATE } from "@/lib/seo";
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
    expect(SITE.lastReviewed).toBe("2026-11-09");
    const home = entries.find((e) => e.url === absoluteUrl("/"));
    expect(home?.lastModified).toBe("2026-11-09");
  });
});

describe("pageMeta", () => {
  it("sets title, description, canonical and OG url/images", () => {
    const meta = pageMeta({ title: "Contact", description: "Who makes it.", path: "/contact" });
    expect(meta.title).toBe("Contact");
    expect(renderedTitle(meta.title)).toBe(`Contact | ${SITE.name}`);
    expect(meta.description).toBe("Who makes it.");
    expect(meta.alternates).toEqual({ canonical: "/contact" });
    expect(meta.openGraph?.url).toBe(absoluteUrl("/contact"));
    expect(meta.openGraph?.title).toBe("Contact");
    expect(meta.openGraph?.description).toBe("Who makes it.");
    expect(meta.openGraph?.images).toBeDefined();
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("marks a title that already includes the brand as absolute so the template does not repeat it", () => {
    const title = `Prompt Packs: Work-safe, tested templates | ${SITE.name}`;
    const meta = pageMeta({ title, description: "Packs.", path: "/packs", images: "file" });
    expect(meta.title).toEqual({ absolute: title });
    expect(renderedTitle(meta.title)).toBe(title);
    expect(renderedTitle(meta.title).split(SITE.name).length - 1).toBe(1);
    expect(meta.openGraph?.title).toBe(title);
    expect(TITLE_TEMPLATE).toBe(`%s | ${SITE.name}`);
  });

  it("omits images when a file-based OG image will supply them", () => {
    const meta = pageMeta({ title: "Packs", description: "Packs.", path: "/packs", images: "file" });
    expect(meta.alternates).toEqual({ canonical: "/packs" });
    expect(meta.openGraph?.url).toBe(absoluteUrl("/packs"));
    expect(meta.openGraph?.images).toBeUndefined();
    expect(meta.twitter?.images).toBeUndefined();
  });
});
