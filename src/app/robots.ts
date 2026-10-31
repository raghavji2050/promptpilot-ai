import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/api/card"], disallow: ["/api/", "/dashboard", "/login"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
