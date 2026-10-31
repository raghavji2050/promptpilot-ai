import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security-headers";

// Cache Components is intentionally off: every content page is fully static (SSG), and
// `dynamicParams = false` (incompatible with cacheComponents) gives real 404s for unknown slugs.
const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders() }];
  },
};

export default nextConfig;
