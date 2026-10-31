import { describe, it, expect } from "vitest";
import { buildCsp, securityHeaders } from "@/lib/security-headers";
import { POST } from "@/app/api/csp-report/route";
import { NextRequest } from "next/server";

const req = (body: string) => new NextRequest("http://localhost/api/csp-report", { method: "POST", body, headers: { "content-type": "application/csp-report" } });

describe("security headers", () => {
  it("ships CSP report-only with key directives", () => {
    const csp = buildCsp();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("report-uri /api/csp-report");
    const keys = securityHeaders().map((h) => h.key);
    expect(keys).toContain("Content-Security-Policy-Report-Only");
    expect(keys).toContain("Strict-Transport-Security");
    expect(keys).not.toContain("Content-Security-Policy");
  });
});

describe("/api/csp-report", () => {
  it("accepts a valid report with 204", async () => {
    const res = await POST(req(JSON.stringify({ "csp-report": { "document-uri": "https://x/", "violated-directive": "script-src", "blocked-uri": "https://evil" } })));
    expect(res.status).toBe(204);
  });
  it("rejects bad JSON and non-reports with 400", async () => {
    expect((await POST(req("not json"))).status).toBe(400);
    expect((await POST(req(JSON.stringify({ foo: 1 })))).status).toBe(400);
  });
  it("rejects oversized bodies with 413", async () => {
    expect((await POST(req("x".repeat(9000)))).status).toBe(413);
  });
});
