import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildUniversal, explainPrompt, festivalGoalSentence, fromShareParams, toShareParams, variations, whatWeAdded, type UniversalInput } from "@/lib/engine";
import { FESTIVALS, FESTIVAL_GOALS } from "@/lib/festivals";

beforeEach(() => { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-10-18T06:00:00Z")); });
afterEach(() => vi.useRealTimers());

const mk = (slug: string, goal: string, extra: Record<string, string> = {}, over: Partial<UniversalInput> = {}): UniversalInput => {
  const ex: Record<string, string> = { festival: slug, fgoal: goal, ...extra };
  const name = FESTIVALS.find((f) => f.slug === slug)?.name ?? extra.occasion ?? slug;
  return { goal: festivalGoalSentence({ festivalName: name, goal: goal as never, language: over.language, platform: ex.platform, extra: ex }), targetId: "chatgpt", extra: ex, ...over };
};

describe("festival prompts meet the expert standard", () => {
  it.each(FESTIVAL_GOALS.filter((g) => g.id !== "image").map((g) => g.id))("%s has role, festival context, success, steps, constraints, output and checks", (goal) => {
    const r = buildUniversal(mk("diwali", goal));
    expect(r.kind).toBe("text");
    expect(r.festival).toMatchObject({ slug: "diwali", goal });
    for (const h of ["## Role", "## Context", "Festival: Diwali", "Date (India): 6–11 Nov 2026, main day Sun, 8 Nov 2026", "Success looks like:", "## Steps", "## Constraints", "## Output format", "## Before you answer, check"]) expect(r.text, `${goal}: ${h}`).toContain(h);
    expect(r.text).toContain("Do not state auspicious timings (muhurat) as fact");
    expect(r.text).toMatch(/If details are missing|Before you start/);
  });
  it("business prompts never invent offers and use the given offer verbatim", () => {
    const none = buildUniversal(mk("diwali", "business-campaign", { business: "sweet shop", location: "Indore" }));
    expect(none.text).toContain("Never invent discounts, prices, free gifts");
    expect(none.text).toContain("[YOUR OFFER]");
    expect(none.text).toContain("Business: sweet shop");
    const withOffer = buildUniversal(mk("diwali", "product-promo", { product: "kaju katli 500 g", offer: "free gift wrap above ₹999" }));
    expect(withOffer.text).toContain("Offer: free gift wrap above ₹999");
    expect(withOffer.text).not.toMatch(/\d+% off/);
  });
  it("provisional dates are flagged in the prompt", () => {
    const r = buildUniversal(mk("govardhan-puja", "greeting"));
    expect(r.text).toContain("Provisional: the date may differ by region or panchang");
  });
  it("festival care rules flow into constraints (Karwa Chauth inclusivity, Gurpurab imagery)", () => {
    expect(buildUniversal(mk("karwa-chauth", "greeting", { recipient: "my wife" })).text).toContain("never shame anyone for fasting or not fasting");
    expect(buildUniversal(mk("karwa-chauth", "greeting", { recipient: "my wife" })).text).toContain("6 greetings for my wife");
    expect(buildUniversal(mk("guru-nanak-jayanti", "social-post")).text).toContain("Do not generate images depicting Guru Nanak Dev Ji");
  });
  it("languages: Hindi in Devanagari, Hinglish in Latin script, regional with honesty clause", () => {
    expect(buildUniversal(mk("diwali", "greeting", {}, { language: "Hindi" })).text).toContain("Devanagari");
    expect(buildUniversal(mk("diwali", "greeting", {}, { language: "Hinglish" })).text).toContain("Hindi in Latin script");
    const ta = buildUniversal(mk("pongal", "greeting", {}, { language: "Tamil" })).text;
    expect(ta).toContain("Respond in Tamil");
    expect(ta).toContain("if you are not fully confident in Tamil, say so");
  });
  it("Claude gets XML tags, concise mode stays short but keeps care rules", () => {
    const x = buildUniversal(mk("chhath-puja", "educational", { level: "Class 5" }, { targetId: "claude" }));
    expect(x.text).toContain("<context>");
    expect(x.text).toContain("Audience level: Class 5");
    const std = buildUniversal(mk("chhath-puja", "social-post"));
    const c = buildUniversal(mk("chhath-puja", "social-post", {}, { mode: "concise" }));
    expect(c.text.length).toBeLessThan(std.text.length * 0.75);
    expect(c.text).toContain("Chhath has strict observances");
  });
  it("ask-first turns missing details into questions", () => {
    const r = buildUniversal({ ...mk("diwali", "business-campaign"), askFirst: true });
    expect(r.text).toMatch(/Ask me these \d+ questions/);
    expect(r.text).toContain("What offer, if any, will you run? (We won't invent one.)");
  });
  it("custom occasion works without dates", () => {
    const r = buildUniversal(mk("custom", "social-post", { occasion: "Onam" }));
    expect(r.text).toContain("Festival: Onam");
    expect(r.text).not.toContain("Date (India)");
    expect(r.festival?.name).toBe("Onam");
  });
  it("unknown festival or goal falls back to the universal engine", () => {
    expect(buildUniversal({ goal: "Write Diwali wishes", targetId: "chatgpt", extra: { festival: "nope", fgoal: "greeting" } }).festival).toBeUndefined();
    expect(buildUniversal({ goal: "Write Diwali wishes", targetId: "chatgpt", extra: { festival: "diwali", fgoal: "nope" } }).festival).toBeUndefined();
  });
});

describe("festival image prompts", () => {
  it("Midjourney: comma style, aspect from platform, care negatives first, text warning", () => {
    const r = buildUniversal(mk("guru-nanak-jayanti", "image", { platform: "Instagram" }, { targetId: "midjourney" }));
    expect(r.kind).toBe("image");
    expect(r.text).toMatch(/illuminated gurdwara at night.*--ar 4:5 --no depictions of the Sikh Gurus, Gurmukhi script, text/);
    expect(r.warnings.join(" ")).toContain("render text imperfectly");
  });
  it("chat/image tools get an Avoid line; WhatsApp → 9:16; product shots use product photography", () => {
    const r = buildUniversal(mk("diwali", "image", { platform: "WhatsApp", product: "dry-fruit gift box" }, { targetId: "ideogram" }));
    expect(r.text).toContain("Aspect ratio: 9:16");
    expect(r.text).toContain("dry-fruit gift box styled for Diwali");
    expect(r.text).toContain("festive commercial product photography");
    expect(r.text).toMatch(/Avoid: .*text/);
    expect(r.text).toContain("empty space in the upper third for adding text later");
  });
  it("Republic Day images avoid flag misuse", () => {
    expect(buildUniversal(mk("republic-day", "image", {}, { targetId: "midjourney" })).text).toContain("--no torn or upside-down national flag");
  });
});

describe("festival results integrate with existing actions", () => {
  it("share params round-trip the festival", () => {
    const input = mk("dussehra", "reel", { platform: "Instagram" }, { language: "Hindi" });
    const p = toShareParams(input);
    expect(p.get("x_festival")).toBe("dussehra");
    const back = fromShareParams((k) => p.get(k), p.keys());
    expect(buildUniversal({ ...input, ...back } as UniversalInput).text).toBe(buildUniversal(input).text);
  });
  it("variations, explain and what-we-added work", () => {
    const input = mk("diwali", "social-post");
    expect(variations(input).length).toBe(3);
    expect(explainPrompt(buildUniversal(input)).join(" ")).toContain("Festival context");
    expect(whatWeAdded(buildUniversal(input)).map((c) => c.id)).toEqual(expect.arrayContaining(["role", "context", "success", "steps", "constraints", "format", "checks"]));
  });
  it("goal sentence reflects language and fields", () => {
    expect(festivalGoalSentence({ festivalName: "Diwali", goal: "business-campaign", language: "Hinglish", extra: { business: "sweet shop", location: "Indore" } })).toBe("Plan a Diwali marketing campaign for my sweet shop in Indore in Hinglish");
    expect(festivalGoalSentence({ festivalName: "Holi", goal: "image", platform: "Instagram", extra: {} })).toBe("Create an image prompt for a Holi poster for Instagram");
  });
});
