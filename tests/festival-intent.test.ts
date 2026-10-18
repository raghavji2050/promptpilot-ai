import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildUniversal, detectFestivalIntent, findFestivalInText, toShareParams, fromShareParams } from "@/lib/engine";

const build = (goal: string, extra: Partial<Parameters<typeof buildUniversal>[0]> = {}) => buildUniversal({ goal, targetId: "chatgpt", ...extra });

describe("free-text festival intent", () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-18T06:30:00Z")); });
  afterEach(() => vi.useRealTimers());

  it("the reported bug: Diwali sale post → festival single post, not a growth plan", () => {
    const r = build("Diwali sale post for my boutique in Mohali, Hinglish, Instagram");
    expect(r.festival).toMatchObject({ slug: "diwali", goal: "social-post" });
    expect(r.source).toBe("detected");
    expect(r.text).not.toMatch(/30-day|growth strategist/i);
    expect(r.text).toMatch(/one Diwali post ready to publish/);
    expect(r.text).toContain("Account / brand: boutique");
    expect(r.text).toContain("Location: Mohali");
    expect(r.text).toMatch(/Respond in Hinglish/);
    expect(r.text).toMatch(/Hindi in Latin script/);
    expect(r.text).toMatch(/\[YOUR OFFER\]/);
    expect(r.text).toMatch(/sale\/offer post/);
    expect(r.text).toMatch(/Never invent discounts/);
    expect(r.text).toContain("8 Nov 2026");
  });

  it.each([
    ["Bhai Dooj message for my sister", "bhai-dooj", "greeting", /for my sister|sister/],
    ["Karwa Chauth greeting for my wife in Hindi", "karwa-chauth", "greeting", /Respond in Hindi/],
    ["Christmas offer reel for my bakery", "christmas", "reel", /Reel script/],
    ["happy deepawali wishes for clients", "diwali", "greeting", /Diwali/],
    ["Xmas Instagram caption for my cafe", "christmas", "social-post", /Instagram/],
    ["Gurpurab greetings in Punjabi", "guru-nanak-jayanti", "greeting", /Respond in Punjabi/],
    ["Chhath puja facebook post for my sweet shop", "chhath-puja", "social-post", /sweet shop/],
    ["Diwali marketing campaign for my salon in Indore", "diwali", "business-campaign", /campaign plan/],
    ["Holi poster for my cafe", "holi", "image", /--|Negative|Avoid|text/i],
    ["essay on the history of Dussehra for class 6", "dussehra", "educational", /explainer|Dussehra/],
  ])("%s → %s / %s", (goal, slug, fgoal, re) => {
    const r = build(goal);
    expect(r.festival).toMatchObject({ slug, goal: fgoal });
    expect(r.text).toMatch(re);
    expect(r.text).not.toMatch(/30-day plan/);
  });

  it("generic Instagram routing: single caption/post stays single; growth stays growth", () => {
    expect(build("instagram caption for my cafe").sub?.id).toBe("captions-hooks");
    expect(build("write an instagram post for my bakery").sub?.id).toBe("captions-hooks");
    expect(build("instagram reel script for my salon").sub?.id).toBe("tiktok");
    for (const g of ["instagram caption for my cafe", "write an instagram post for my bakery"]) expect(build(g).text).not.toMatch(/30-day plan/);
    expect(build("grow my instagram").sub?.id).toBe("instagram-growth");
    expect(build("grow my instagram").text).toMatch(/30-day plan/);
    expect(build("instagram strategy to get more followers for my cafe").sub?.id).toBe("instagram-growth");
    expect(build("linkedin post about my promotion").sub?.id).toBe("linkedin");
  });

  it("does not hijack non-festival or explicit requests", () => {
    expect(build("build a Diwali landing page in React").festival).toBeUndefined();
    expect(build("khichdi recipe for dinner").festival).toBeUndefined();
    expect(build("plan my holiday to Goa").festival).toBeUndefined();
    expect(build("Diwali").festival).toBeUndefined(); // festival named but no goal
    expect(build("Diwali sale post", { categoryId: "business" }).festival).toBeUndefined(); // user picked a category
    expect(build("Diwali sale post", { extra: { festival: "holi", fgoal: "greeting" } }).festival?.slug).toBe("holi"); // explicit festival wins
  });

  it("helpers", () => {
    expect(findFestivalInText("Gudi Padwa wishes")?.slug).toBe("gudi-padwa-ugadi");
    expect(findFestivalInText("navratri reel")?.slug).toBe("durga-puja");
    expect(findFestivalInText("holiday sale")).toBeNull();
    const d = detectFestivalIntent("Eid status for my friends in Urdu");
    expect(d).toMatchObject({ goal: "social-post", language: "Urdu" });
    expect(detectFestivalIntent("Punjabi sweets Diwali post")?.language).toBeUndefined();
  });

  it("auto-detected prompts still round-trip through share links", () => {
    const input = { goal: "Diwali sale post for my boutique in Mohali, Hinglish, Instagram", targetId: "chatgpt" };
    const p = toShareParams(input);
    const back = fromShareParams((k) => p.get(k), p.keys());
    expect(buildUniversal({ ...back, goal: back.goal!, targetId: back.targetId! }).text).toBe(buildUniversal(input).text);
  });
});
