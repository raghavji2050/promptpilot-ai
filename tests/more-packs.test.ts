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
  it("routes Hinglish examples to the exact pack subcategory", () => {
    for (const t of p.items) expect(detectIntent(t.hinglish)?.subcategoryId, t.hinglish).toBe(t.input.subcategoryId);
  });
});
it("hub lists four packs", () => expect(PACKS.map((p) => p.href)).toEqual(["/packs/job-hunting", "/packs/students", "/packs/small-business", "/packs/freelancers"]));

it("routes English pack phrases exactly", () => {
  expect(detectIntent("Write a WhatsApp message for my shop offer")?.subcategoryId).toBe("sales-scripts");
  expect(detectIntent("Write a proposal for a client project")?.subcategoryId).toBe("freelancing");
  expect(detectIntent("Photosynthesis simple mein samjhao")?.subcategoryId).toBe("explain-simply");
});
import { buildUniversal as bu } from "@/lib/engine/universal";
it("Hindi and Hinglish output toggle adds deterministic language instructions", () => {
  expect(bu({ goal: "Write a shop offer", targetId: "chatgpt", language: "Hindi" }).text).toMatch(/Respond in Hindi[\s\S]*Devanagari/);
  expect(bu({ goal: "Write a shop offer", targetId: "chatgpt", language: "Hinglish (Hindi in Latin script)" }).text).toMatch(/Hinglish/);
});
