import { describe, expect, it } from "vitest";
import { getShowcase } from "@/lib/showcase";

describe("showcase", () => {
  const cards = getShowcase();
  it("has text, image/reel and App Builder cards", () => {
    expect(cards).toHaveLength(6);
    expect(cards.some((c) => c.tryHref.startsWith("/image-reel-builder?"))).toBe(true);
    expect(cards.some((c) => c.tryHref.startsWith("/builder?goal="))).toBe(true);
    expect(cards.some((c) => c.id === "browser-game")).toBe(true);
    expect(cards.some((c) => c.id === "crud-app")).toBe(true);
  });
  it("built prompt is longer than weak and outputs are labelled", () => {
    for (const c of cards) { expect(c.built.length).toBeGreaterThan(c.weak.length * 3); expect(c.outputLabel).toBe("Example output"); }
  });
  it("midjourney card has flags", () => expect(cards.find((c) => c.id === "diwali-poster")!.built).toContain("--ar 4:5"));
  it("App Builder cards use Claude Code briefs with stack and acceptance", () => {
    const game = cards.find((c) => c.id === "browser-game")!;
    expect(game.weak).toBe("make a browser game");
    expect(game.built).toMatch(/Stack:/);
    expect(game.built).toMatch(/Acceptance criteria:/);
    expect(game.tryHref).toMatch(/^\/builder\?/);
    const crud = cards.find((c) => c.id === "crud-app")!;
    expect(crud.weak).toBe("banao ek CRUD app");
    expect(crud.built).toMatch(/CRUD|Prisma|validation/i);
  });
});
