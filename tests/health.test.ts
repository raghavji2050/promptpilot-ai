import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/health/route";

describe("/api/health", () => {
  it("returns ok with boolean checks and no secret values", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    for (const v of Object.values(body.checks)) expect(["boolean", "number"]).toContain(typeof v);
  });
});
