import { describe, expect, it } from "vitest";
import { FESTIVAL_TOPICS, getTopic, topicsFor } from "@/content/festival-topics";
import { FESTIVALS, getFestival } from "@/lib/festivals";
import { buildUniversal, festivalGoalSentence, isFestivalGoal } from "@/lib/engine";
import sitemap from "@/app/sitemap";

describe("festival SEO topics", () => {
  it("has 8 distinct topics with valid festivals and goals", () => {
    expect(FESTIVAL_TOPICS).toHaveLength(8);
    const keys = new Set(FESTIVAL_TOPICS.map((t) => `${t.festival}/${t.topic}`));
    expect(keys.size).toBe(8);
    for (const t of FESTIVAL_TOPICS) {
      const f = getFestival(t.festival, FESTIVALS);
      expect(f, t.festival).toBeTruthy();
      expect(isFestivalGoal(t.sample.goal)).toBe(true);
      expect(f!.goals).toContain(t.sample.goal);
      for (const v of t.variations) expect(isFestivalGoal(v.goal)).toBe(true);
      expect(t.topic).toMatch(/^[a-z0-9-]+$/);
      expect(t.tips.length).toBeGreaterThanOrEqual(4);
      expect(t.faqs.length).toBeGreaterThanOrEqual(3);
    }
  });
  it("titles, descriptions and h1s are unique and sized for search", () => {
    for (const k of ["title", "description", "h1", "intro"] as const) {
      expect(new Set(FESTIVAL_TOPICS.map((t) => t[k])).size).toBe(8);
    }
    for (const t of FESTIVAL_TOPICS) {
      expect(t.title.length).toBeLessThanOrEqual(70);
      expect(t.description.length).toBeGreaterThanOrEqual(110);
      expect(t.description.length).toBeLessThanOrEqual(160);
    }
  });
  it("makes no invented claims", () => {
    const all = JSON.stringify(FESTIVAL_TOPICS);
    // "trending" may only appear as a warning against trusting such claims
    for (const m of all.matchAll(/[^.]*\btrending\b[^.]*/gi)) expect(m[0]).toMatch(/don't rely/i);
    expect(all).not.toMatch(/\d+% off|\d+\s*(k|lakh|million)\+? (users|downloads)|best-selling|#1/i);
  });
  it("sample prompts build through the festival engine", () => {
    for (const t of FESTIVAL_TOPICS) {
      const s = t.sample;
      const extra: Record<string, string> = { festival: t.festival, fgoal: s.goal, ...(s.platform ? { platform: s.platform } : {}), ...(s.extra ?? {}) };
      const f = getFestival(t.festival, FESTIVALS)!;
      const r = buildUniversal({ goal: festivalGoalSentence({ festivalName: f.name, goal: s.goal, audience: s.audience, language: s.language, platform: s.platform, extra }), targetId: s.targetId ?? "chatgpt", language: s.language, audience: s.audience, mode: "standard", extra });
      expect(r.festival?.slug).toBe(t.festival);
      expect(r.text).toContain(f.name);
      expect(r.text.length).toBeGreaterThan(600);
    }
  });
  it("helpers and sitemap", () => {
    expect(getTopic("diwali", "greeting-cards")?.sample.goal).toBe("greeting");
    expect(getTopic("diwali", "nope")).toBeUndefined();
    expect(topicsFor("diwali")).toHaveLength(3);
    const urls = sitemap().map((u) => u.url);
    for (const t of FESTIVAL_TOPICS) expect(urls.some((u) => u.endsWith(`/festivals/${t.festival}/${t.topic}`))).toBe(true);
  });
});
