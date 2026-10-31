/**
 * Security headers applied to every route (see next.config.ts).
 * CSP ships as Content-Security-Policy-Report-Only first (Day 5); violations are
 * POSTed to /api/csp-report and logged, so we can enforce it later without breaking pages.
 */
export const CSP_DIRECTIVES: Record<string, string[]> = {
  "default-src": ["'self'"],
  // Next.js inline bootstrap + JSON-LD need 'unsafe-inline' until nonces are added.
  "script-src": ["'self'", "'unsafe-inline'", "https://challenges.cloudflare.com", "https://va.vercel-scripts.com"],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "blob:", "https:"],
  "font-src": ["'self'", "data:"],
  "connect-src": ["'self'", "https://*.supabase.co", "wss://*.supabase.co", "https://challenges.cloudflare.com", "https://va.vercel-scripts.com"],
  "frame-src": ["https://challenges.cloudflare.com"],
  "frame-ancestors": ["'none'"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "report-uri": ["/api/csp-report"],
};

export function buildCsp(directives: Record<string, string[]> = CSP_DIRECTIVES): string {
  return Object.entries(directives)
    .map(([k, v]) => `${k} ${v.join(" ")}`)
    .join("; ");
}

export function securityHeaders(): { key: string; value: string }[] {
  return [
    { key: "Content-Security-Policy-Report-Only", value: buildCsp() },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  ];
}
