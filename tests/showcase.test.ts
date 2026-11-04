import { describe, expect, it } from "vitest";
import { getShowcase } from "@/lib/showcase";

describe("showcase", () => {
  const cards = getShowcase();
  it("has text and image/reel cards", () => {
    expect(cards.length).toBeGreaterThanOrEqual(4);
    expect(cards.some((c) => c.tryHref.startsWith("/image-reel-builder?"))).toBe(true);
    expect(cards.some((c) => c.tryHref.startsWith("/builder?goal="))).toBe(true);
  });
  it("built prompt is longer than weak and outputs are labelled", () => {
    for (const c of cards) { expect(c.built.length).toBeGreaterThan(c.weak.length * 3); expect(c.outputLabel).toBe("Example output"); }
  });
  it("midjourney card has flags", () => expect(cards.find((c) => c.id === "diwali-poster")!.built).toContain("--ar 4:5"));
});
