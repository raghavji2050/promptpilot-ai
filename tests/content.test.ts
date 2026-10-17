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

import { requiredInputs, UNIVERSAL_PROMPTS } from "@/content";
import { CATEGORIES, findSubcategory } from "@/lib/categories";
import { USE_CASES } from "@/content/use-cases";

describe("goal-based library", () => {
  it("every prompt has a valid category; every non-coding category has at least 3 prompts", () => {
    const ids = new Set(CATEGORIES.map((c) => c.id));
    for (const p of ALL_PROMPTS) expect(ids.has(p.cat!), p.slug).toBe(true);
    for (const c of CATEGORIES) expect(ALL_PROMPTS.filter((p) => p.cat === c.id).length, c.id).toBeGreaterThanOrEqual(3);
  });
  it("subcategory ids on prompts exist and belong to the prompt's category", () => {
    for (const p of ALL_PROMPTS) if (p.sub) expect(findSubcategory(p.sub)?.category.id, p.slug).toBe(p.cat);
  });
  it("developer prompts live only in Coding", () => {
    for (const p of ALL_PROMPTS.filter((x) => x.kind === "developer" || x.stacks?.length)) expect(p.cat).toBe("coding");
  });
  it("new prompts have audience, use case, output type and an added date; none are falsely premium", () => {
    for (const p of UNIVERSAL_PROMPTS) {
      expect(p.audience && p.useCase && p.outputType, p.slug).toBeTruthy();
      expect(p.added).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(ALL_PROMPTS.some((p) => p.premium)).toBe(false);
  });
  it("health, legal and finance library prompts carry guardrails", () => {
    for (const p of ALL_PROMPTS.filter((x) => ["health-info", "legal-info", "financial-education", "budget"].includes(x.sub ?? ""))) {
      expect(/consult|advisor|professional|lawyer|doctor/i.test(p.body), p.slug).toBe(true);
    }
  });
  it("requiredInputs extracts unique bracketed placeholders", () => {
    expect(requiredInputs("Hi [name], about [topic] and [name] [source needed]")).toEqual(["name", "topic"]);
  });
  it("searchLibrary filters by category, sub, output type and tier, and sorts", () => {
    expect(searchLibrary(ALL_PROMPTS, { cat: "career" }).every((p) => p.cat === "career")).toBe(true);
    expect(searchLibrary(ALL_PROMPTS, { cat: "career", sub: "interview-prep" }).map((p) => p.slug)).toContain("job-interview-coach");
    expect(searchLibrary(ALL_PROMPTS, { outputType: "Table" }).every((p) => p.outputType === "Table")).toBe(true);
    expect(searchLibrary(ALL_PROMPTS, { tier: "premium" })).toHaveLength(0);
    const az = searchLibrary(ALL_PROMPTS, { sort: "az" }).map((p) => p.title);
    expect(az).toEqual([...az].sort((a, b) => a.localeCompare(b)));
    expect(searchLibrary(ALL_PROMPTS, { sort: "newest" })[0].added).toBe("2026-10-17");
  });
  it("use-case landing pages are unique and reference real prompts", () => {
    expect(USE_CASES.length).toBeGreaterThanOrEqual(7);
    expect(new Set(USE_CASES.map((u) => u.slug)).size).toBe(USE_CASES.length);
    expect(new Set(USE_CASES.map((u) => u.description)).size).toBe(USE_CASES.length);
    for (const u of USE_CASES) {
      for (const s of u.prompts) expect(getPrompt(s), `${u.slug}:${s}`).toBeDefined();
      for (const st of u.starters) if (st.sub) expect(findSubcategory(st.sub), st.sub).toBeDefined();
      expect(u.faqs.length).toBeGreaterThanOrEqual(3);
    }
  });
});
