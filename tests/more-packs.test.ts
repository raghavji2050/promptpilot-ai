import { describe, expect, it } from "vitest";
import { MORE_PACKS } from "@/content/more-packs";
import { PACKS } from "@/content/packs";
import { buildUniversal, detectIntent } from "@/lib/engine/universal";

describe.each(MORE_PACKS)("$slug pack", (p) => {
  it("has 5-6 templates routed to their subcategory, deterministic, with India + no-invent rules", () => {
    expect(p.items.length).toBeGreaterThanOrEqual(5);
    for (const t of p.items) {
      const r = buildUniversal(t.input);
      expect(r.sub?.id, t.id).toBe(t.input.subcategoryId);
      expect(buildUniversal(t.input).text).toBe(r.text);
      expect(r.text, t.id).toMatch(/Never invent/);
      expect(r.text, t.id).toMatch(/Hinglish/);
    }
  });
  it("routes Hinglish examples to a subcategory", () => {
    for (const t of p.items) expect(detectIntent(t.hinglish)?.subcategoryId, t.hinglish).toBeTruthy();
  });
});
it("hub lists four packs", () => expect(PACKS.map((p) => p.href)).toEqual(["/packs/job-hunting", "/packs/students", "/packs/small-business", "/packs/freelancers"]));
