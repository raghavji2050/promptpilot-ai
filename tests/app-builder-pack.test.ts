import { describe, expect, it } from "vitest";
import { APP_BUILDER_PACK, MORE_PACKS } from "@/content/more-packs";
import { buildUniversal, detectIntent } from "@/lib/engine/universal";

describe("App Builder pack", () => {
  it("is listed with game, landing page and CRUD templates", () => {
    expect(MORE_PACKS.find((p) => p.slug === "app-builder")?.items).toBe(APP_BUILDER_PACK);
    expect(APP_BUILDER_PACK.map((t) => t.id)).toEqual(expect.arrayContaining(["browser-game", "landing-page", "crud-app", "chrome-extension", "laravel-api", "nextjs-api"]));
  });
  it.each(APP_BUILDER_PACK)("$id has stack, file structure, acceptance criteria and step plan, deterministic", (t) => {
    const r = buildUniversal(t.input);
    expect(t.input.targetId).toBe("claude-code");
    for (const k of [/Stack:/, /File structure:/, /Acceptance criteria:/, /Step plan:/, /Never invent/, /secrets/]) expect(r.text).toMatch(k);
    expect(buildUniversal(t.input).text).toBe(r.text);
    expect(detectIntent(t.hinglish)?.subcategoryId).toBe(t.input.subcategoryId);
  });
});
