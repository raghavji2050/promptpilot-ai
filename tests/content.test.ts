import { describe, expect, it } from "vitest";
import { ALL_PROMPTS, SOCIAL_PROMPTS, searchLibrary, getPrompt } from "@/content";
import { TARGETS } from "@/lib/engine";

describe("content integrity", () => {
  it("slugs are unique and URL-safe", () => {
    const slugs = ALL_PROMPTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]+$/);
  });
  it("every target id exists", () => {
    const ids = new Set(TARGETS.map((t) => t.id));
    for (const p of ALL_PROMPTS) for (const t of p.targets) expect(ids.has(t), `${p.slug}:${t}`).toBe(true);
  });
  it("every social prompt has an honest trend label; 'current' requires dated sources", () => {
    for (const p of SOCIAL_PROMPTS) {
      expect(p.trend, p.slug).toBeDefined();
      if (p.trend!.status === "current") expect(p.trend!.sources.length, p.slug).toBeGreaterThan(0);
      for (const s of p.trend!.sources) expect(s.url).toMatch(/^https:\/\//);
      expect(p.trend!.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
  it("photo-edit prompts include an identity-preservation instruction", () => {
    for (const p of SOCIAL_PROMPTS.filter((x) => x.requiresPhoto)) {
      expect(/same face|faces|identity|पहचान|चेहरा/i.test(p.body), p.slug).toBe(true);
    }
  });
  it("developer prompts state the failure mode they prevent", () => {
    for (const p of ALL_PROMPTS.filter((x) => x.kind === "developer")) expect(p.failureMode, p.slug).toBeTruthy();
  });
  it("no prompt body contains fabricated metric claims like 'X% better'", () => {
    for (const p of ALL_PROMPTS) expect(/\b\d+% (better|more|increase)/i.test(p.body), p.slug).toBe(false);
  });
});

describe("searchLibrary", () => {
  it("filters by kind, stack, trend and text (AND semantics)", () => {
    expect(searchLibrary(ALL_PROMPTS, { kind: "developer", stack: "laravel" }).every((p) => p.stacks?.includes("laravel"))).toBe(true);
    expect(searchLibrary(ALL_PROMPTS, { trend: "current" }).every((p) => p.trend?.status === "current")).toBe(true);
    const r = searchLibrary(ALL_PROMPTS, { q: "n+1 eager" });
    expect(r.map((p) => p.slug)).toContain("laravel-n-plus-one");
    expect(searchLibrary(ALL_PROMPTS, { q: "zzzz-not-found" })).toHaveLength(0);
    expect(searchLibrary(ALL_PROMPTS, { locale: "hi" }).length).toBeGreaterThan(0);
  });
  it("getPrompt finds by slug", () => {
    expect(getPrompt("pr-review")?.title).toMatch(/pull request/i);
    expect(getPrompt("nope")).toBeUndefined();
  });
});
