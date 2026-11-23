import { describe, it, expect } from "vitest";
import { waitlistSource, PAY_INTENTS } from "@/components/WaitlistForm";
describe("waitlist pay-intent", () => {
  it("encodes optional answer in source within 40 chars", () => {
    expect(waitlistSource("")).toBe("pricing");
    for (const p of PAY_INTENTS) { const s = waitlistSource(p); expect(s).toBe(`pricing|pay:${p}`); expect(s.length).toBeLessThanOrEqual(40); }
  });
});
