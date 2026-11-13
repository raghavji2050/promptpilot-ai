import { describe, it, expect } from "vitest";
import { applyContext, sanitizeContext, hasContext, EMPTY_CONTEXT } from "@/lib/my-context";

describe("my context", () => {
  it("returns text unchanged when empty or off", () => {
    expect(applyContext("Hi [NICHE]", EMPTY_CONTEXT)).toBe("Hi [NICHE]");
    expect(applyContext("Hi", { business: "Bakery", audience: "", voice: "", enabled: false })).toBe("Hi");
  });
  it("prepends context and fills placeholders", () => {
    const out = applyContext("Write posts for [NICHE] aimed at [AUDIENCE].", { business: "Home bakery in Mohali", audience: "Young families", voice: "Warm Hinglish", enabled: true });
    expect(out.startsWith("My context (use it for every answer):")).toBe(true);
    expect(out).toContain("- My voice and tone: Warm Hinglish");
    expect(out).toContain("Write posts for Home bakery in Mohali aimed at Young families.");
    expect(out).not.toContain("[NICHE]");
  });
  it("sanitizes stored data", () => {
    const c = sanitizeContext({ business: "  a\n\nb  ", audience: 5, voice: "x".repeat(500) });
    expect(c.business).toBe("a b");
    expect(c.audience).toBe("");
    expect(c.voice.length).toBe(300);
    expect(c.enabled).toBe(true);
    expect(hasContext(sanitizeContext(null))).toBe(false);
  });
});
