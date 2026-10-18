import { describe, expect, it } from "vitest";
import { buildUniversal, type UniversalInput } from "@/lib/engine";
import { EXPERT_BLOCKS } from "@/lib/engine/expert-blocks";
import { expertFor, CATEGORY_DEFAULTS } from "@/lib/engine/expert";
import { CATEGORIES } from "@/lib/categories";

const run = (goal: string, over: Partial<UniversalInput> = {}) => buildUniversal({ goal, targetId: "chatgpt", mode: "standard", ...over });

/** Every expert prompt must contain these sections. */
function expectExpertShape(text: string) {
  expect(text).toMatch(/^## Role\nYou are an? .{40,}/);
  expect(text).toMatch(/## Task\n.+\nSuccess looks like: .{30,}/);
  expect(text).toMatch(/## Steps\n1\. /);
  expect(text).toMatch(/## Constraints\n- /);
  expect(text).toMatch(/## Output format\n- /);
  expect(text).toMatch(/## Before you answer, check\n- /);
  expect(text).not.toMatch(/avoid generic filler/); // old boilerplate is gone
}

describe("expert prompts: task-specific content for 8 sample goals", () => {
  const cases: { goal: string; sub: string; must: RegExp[] }[] = [
    { goal: "Help me grow my Instagram account", sub: "instagram-growth", must: [/Instagram growth strategist/, /10 Reel ideas/, /hook \(on-screen text\)/, /4-week calendar/, /30-day target/, /engagement pods/] },
    { goal: "Help me prepare for a job interview", sub: "interview-prep", must: [/hiring manager and interview coach/, /STAR/, /mock interview: ask one question at a time/i, /Never invent experience/, /Questions to ask them/] },
    { goal: "Validate my business idea for a tiffin service", sub: "startup-validation", must: [/lean startup coach/, /hypothesis/i, /pass threshold \| fail threshold/, /past behaviour/, /go, pivot or stop/] },
    { goal: "Make a 4-week study plan to learn Excel", sub: "study-plan", must: [/spaced repetition/, /spaced review \(day 1, 3, 7/, /Daily plan\*\* table: day \| learn \(min\)/, /final mini-project/] },
    { goal: "Write a polite email asking for a deadline extension", sub: "email", must: [/Subject line/, /Under 150 words/, /I hope this email finds you well/, /first two lines/, /WhatsApp version/] },
    { goal: "Fix a bug in my Laravel login controller", sub: "debugging", must: [/debugs systematically/, /expected vs actual/i, /Likely causes\*\* table/, /Regression test/, /Exact error \/ stack trace/] },
    { goal: "Help me make a monthly budget", sub: "budget", must: [/zero-based/, /50\/30\/20/, /Totals equal income/, /not personalised financial advice/] },
  ];
  for (const c of cases) {
    it(`${c.sub}: ${c.goal}`, () => {
      const r = run(c.goal);
      expect(r.sub?.id).toBe(c.sub);
      expectExpertShape(r.text);
      for (const re of c.must) expect(r.text).toMatch(re);
    });
  }

  it("image generation: comma-style prompt with style, lighting, camera, aspect ratio and Midjourney --no", () => {
    const mj = run("A cozy coffee shop interior", { targetId: "midjourney" }).text;
    expect(mj).toMatch(/^a cozy coffee shop interior, photorealistic, .*soft natural window light, 35mm lens/);
    expect(mj).toMatch(/--ar 1:1 --no text, watermark/);
    // lighting already in the goal is not overridden by a default
    expect(run("A cozy coffee shop at golden hour", { targetId: "midjourney" }).text).not.toMatch(/window light/);
    // generic image tools get an explicit Avoid line instead of Midjourney flags
    const flux = run("Product photo of a steel water bottle", { targetId: "image-generic" }).text;
    expect(flux).toMatch(/^Prompt: .*commercial product photography.*softbox.*100mm macro/);
    expect(flux).toMatch(/Aspect ratio: 4:5/);
    expect(flux).toMatch(/Avoid: .*label text/);
    expect(flux).not.toMatch(/--ar/);
    // vertical uses get 9:16
    expect(run("Generate an image for my Instagram story of a sunrise over mountains", { targetId: "image-generic" }).text).toMatch(/Aspect ratio: 9:16/);
  });

  it("video: shot, camera, duration, aspect ratio and a negative prompt", () => {
    const v = run("a barista pours latte art", { targetId: "video" }).text;
    expect(v).toMatch(/^Prompt: medium shot, slow dolly in, a barista pours latte art/);
    expect(v).toMatch(/Duration: 8 seconds · Aspect ratio: 16:9/);
    expect(v).toMatch(/Negative prompt .*flicker, morphing faces/);
  });

  it("photo edits keep the face unchanged", () => {
    const r = run("Edit my photo to put me in a Diwali festive setting", { categoryId: "design", subcategoryId: "photo-edit" });
    expect(r.text).toMatch(/Using the uploaded photo/);
    expect(r.text).toMatch(/Keep unchanged: the person's face/);
  });
});

describe("expert prompts: user details, missing info and modes", () => {
  it("fills context with the user's actual details and stops assuming them", () => {
    const r = run("Help me grow my Instagram account", { audience: "new mums in Pune", extra: { niche: "postpartum fitness", current: "600 followers, 1 post a week", timePerWeek: "3 hours" } });
    expect(r.text).toMatch(/## Context\nNiche and ideal follower: postpartum fitness\nCurrent stats: 600 followers, 1 post a week\nTime and tools: 3 hours/);
    expect(r.text).toContain("Audience: new mums in Pune");
    expect(r.text).not.toMatch(/Current stats: under 1,000/);
    expect(r.text).toMatch(/- What growth is for: followers who become customers/); // still missing -> assumed
  });

  it("states assumptions by default and asks clarifying questions first when toggled", () => {
    const def = run("Help me prepare for a job interview").text;
    expect(def).toMatch(/## If details are missing\nI haven't told you these yet, so assume:\n- Role and seniority:/);
    expect(def).toMatch(/State these assumptions in one line at the top/);
    const ask = run("Help me prepare for a job interview", { askFirst: true }).text;
    expect(ask).toMatch(/## Before you start\nAsk me these 3 questions in one message, then wait for my answers before doing the task:\n1\. What role, at what level/);
    expect(ask).not.toMatch(/If details are missing/);
  });

  it("details already in the goal are detected and not asked again", () => {
    const r = run("Validate my tiffin service idea in Pune with ₹20,000");
    expect(r.text).not.toMatch(/- Market:/);
    expect(r.text).not.toMatch(/- Validation budget:/);
    expect(r.text).toMatch(/- The idea:/);
    const study = run("Make a study plan to learn Excel, 30 minutes a day").text;
    expect(study).not.toMatch(/- Time and deadline:/);
  });

  it("concise mode keeps role, success criterion, top steps and output but drops self-check", () => {
    const c = run("Help me grow my Instagram account", { mode: "concise" }).text;
    expect(c).toMatch(/^Role: You are an Instagram growth strategist\./);
    expect(c).toMatch(/Success looks like:/);
    expect(c).toMatch(/Assume: /);
    expect(c).not.toMatch(/Before you answer, check/);
    expect(c.length).toBeLessThan(run("Help me grow my Instagram account").text.length * 0.55);
  });

  it("Claude gets XML with task, assumptions and quality_checks tags", () => {
    const x = run("Help me make a monthly budget", { targetId: "claude" }).text;
    for (const tag of ["role", "task", "assumptions", "instructions", "constraints", "format", "quality_checks"]) expect(x).toContain(`<${tag}>`);
  });

  it("explanations describe the new structure", async () => {
    const { explainPrompt } = await import("@/lib/engine");
    const reasons = explainPrompt(run("Help me grow my Instagram account")).join(" ");
    expect(reasons).toMatch(/Success criterion/);
    expect(reasons).toMatch(/Assumptions/);
    expect(reasons).toMatch(/Self-check/);
  });
});

describe("expert registry integrity", () => {
  it("every rich block maps to a real subcategory and is complete", () => {
    const subs = new Set(CATEGORIES.flatMap((c) => c.subcategories.map((s) => s.id)));
    expect(Object.keys(EXPERT_BLOCKS).length).toBeGreaterThanOrEqual(25);
    for (const [id, b] of Object.entries(EXPERT_BLOCKS)) {
      expect(subs.has(id), id).toBe(true);
      expect(b.role.length, id).toBeGreaterThan(50);
      expect(b.slots.length, id).toBeGreaterThanOrEqual(2);
      expect(b.steps.length, id).toBeGreaterThanOrEqual(3);
      expect(b.output.length, id).toBeGreaterThanOrEqual(2);
      expect(b.checks.length, id).toBeGreaterThanOrEqual(2);
    }
  });
  it("every subcategory gets a block with slots and checks (rich or derived)", () => {
    for (const c of CATEGORIES) {
      expect(CATEGORY_DEFAULTS[c.id].checks.length).toBeGreaterThan(0);
      for (const s of c.subcategories) {
        const b = expertFor(c, s)!;
        expect(b.slots.length, s.id).toBeGreaterThan(0);
        expect(b.checks.length, s.id).toBeGreaterThan(0);
        if (!s.visual) expect(b.steps.length, s.id).toBeGreaterThan(0);
      }
    }
  });
});
