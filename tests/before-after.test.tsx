// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { buildUniversal, whatWeAdded, analyzePromptText } from "@/lib/engine";
import { BEFORE_AFTER, ILLUSTRATION_NOTE, pairForSlug } from "@/content/before-after";
import { ALL_PROMPTS, getPrompt } from "@/content";
import { BeforeAfterShowcase } from "@/components/BeforeAfterShowcase";
import { LiveBeforeAfter } from "@/components/LiveBeforeAfter";
import { BeforeAfterCompare } from "@/components/BeforeAfter";

vi.mock("next/link", () => ({ default: ({ href, children, ...p }: { href: string; children: React.ReactNode }) => <a href={href} {...p}>{children}</a> }));
afterEach(cleanup);

const ids = (r: ReturnType<typeof buildUniversal>) => whatWeAdded(r).map((c) => c.id);

describe("whatWeAdded", () => {
  it("lists role, success, assumptions, steps, constraints, tables and self-check for a bare goal", () => {
    const r = buildUniversal({ goal: "Help me grow my Instagram account", targetId: "chatgpt", mode: "standard" });
    expect(ids(r)).toEqual(["role", "success", "assumptions", "steps", "constraints", "format", "checks"]);
    const chips = whatWeAdded(r);
    expect(chips.find((c) => c.id === "format")!.label).toBe("Output format with tables");
    expect(chips.find((c) => c.id === "steps")!.detail).toMatch(/^6 steps/);
    expect(chips.find((c) => c.id === "role")!.detail).toBe("Instagram growth strategist");
  });
  it("reflects user details, ask-first, platform and guardrails", () => {
    const withDetails = buildUniversal({ goal: "Help me grow my Instagram account", targetId: "claude", mode: "standard", askFirst: true, extra: { niche: "baking" } });
    expect(ids(withDetails)).toEqual(expect.arrayContaining(["context", "questions", "platform"]));
    expect(ids(withDetails)).not.toContain("assumptions");
    expect(whatWeAdded(withDetails).find((c) => c.id === "platform")!.label).toBe("XML tags for Claude");
    expect(ids(buildUniversal({ goal: "Help me make a monthly budget", targetId: "chatgpt", mode: "standard" }))).toContain("guardrails");
  });
  it("visual prompts list style, camera, aspect ratio, negative prompt and Midjourney flags", () => {
    const r = buildUniversal({ goal: "A cozy coffee shop interior", targetId: "midjourney", mode: "standard" });
    expect(ids(r)).toEqual(["style", "lighting", "camera", "aspect", "negative", "flags"]);
  });
  it("is empty without a prompt", () => {
    expect(whatWeAdded(buildUniversal({ goal: "", targetId: "chatgpt", mode: "standard" }))).toEqual([]);
  });
  it("analyzePromptText detects structure in hand-written library prompts", () => {
    const study = analyzePromptText(getPrompt("gemini-study-plan")!.body).map((c) => c.id);
    expect(study).toEqual(expect.arrayContaining(["role", "placeholders", "success", "steps", "constraints", "format", "questions"]));
    const mj = analyzePromptText(getPrompt("midjourney-product-hero")!.body).map((c) => c.id);
    expect(mj).toEqual(expect.arrayContaining(["style", "lighting", "camera", "aspect", "negative"]));
    expect(analyzePromptText("write an email").length).toBe(0);
  });
});

describe("curated before/after pairs", () => {
  it("has 8 pairs across different categories, each linked to a real library prompt", () => {
    expect(BEFORE_AFTER).toHaveLength(8);
    const cats = new Set<string>();
    for (const p of BEFORE_AFTER) {
      const item = ALL_PROMPTS.find((x) => x.slug === p.librarySlug);
      expect(item, p.id).toBeTruthy();
      cats.add(item!.cat ?? "none");
      expect(pairForSlug(p.librarySlug!)).toBe(p);
      expect(p.before.prompt.split(/\s+/).length, p.id).toBeLessThanOrEqual(8); // a genuinely vague one-liner
      expect(p.before.response.length).toBeGreaterThan(80);
      expect(p.after.response.length).toBeGreaterThan(p.before.response.length * 0.8);
      expect(p.changes.length).toBeGreaterThanOrEqual(3);
      const r = buildUniversal({ mode: "standard", ...p.after.input });
      expect(r.text.length, p.id).toBeGreaterThan(p.before.prompt.length * 5);
    }
    expect(cats.size).toBeGreaterThanOrEqual(7);
  });
  it("the curated user details actually appear in the generated After prompt", () => {
    const ig = BEFORE_AFTER.find((p) => p.id === "instagram")!;
    const text = buildUniversal({ mode: "standard", ...ig.after.input }).text;
    expect(text).toContain("home baking for working parents");
    expect(text).toContain("640 followers");
    const dbg = buildUniversal({ mode: "standard", ...BEFORE_AFTER.find((p) => p.id === "debug")!.after.input });
    expect(dbg.sub?.id).toBe("debugging");
    expect(dbg.text).toContain("Laravel 11, PHP 8.3, MySQL");
  });
});

describe("Before/After components", () => {
  it("showcase renders tabs, both panels, the illustration label and switches pairs", () => {
    render(<BeforeAfterShowcase />);
    expect(screen.getAllByRole("tab")).toHaveLength(8);
    expect(screen.getByRole("region", { name: "Before" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "After" })).toBeTruthy();
    expect(screen.getByText("how to grow my instagram")).toBeTruthy();
    expect(screen.getAllByText(/written by us for illustration, not a live AI response/).length).toBe(2);
    expect(screen.getByText("What changed")).toBeTruthy();
    expect(screen.getByRole("list", { name: "What we added" })).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Professional email" }));
    expect(screen.getByRole("tab", { name: "Professional email" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("write email for deadline extension")).toBeTruthy();
    expect(screen.getByLabelText("PromptPilot prompt").textContent).toContain("Priya");
    // arrow-key navigation between tabs
    fireEvent.keyDown(screen.getByRole("tablist"), { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Product photo (image AI)" }).getAttribute("aria-selected")).toBe("true");
  });
  it("compare without sample responses shows no illustration label (nothing invented)", () => {
    render(<BeforeAfterCompare beforePrompt="write a story" afterPrompt="You are a children's author…" />);
    expect(screen.queryByText(/for illustration/)).toBeNull();
    expect(ILLUSTRATION_NOTE).toBe("Example output, written by us for illustration, not a live AI response.");
  });
  it("live before/after shows the user's own input and auto-computed chips", () => {
    const goal = "Make a 4-week study plan to learn Excel";
    const r = buildUniversal({ goal, targetId: "gemini", mode: "standard" });
    render(<LiveBeforeAfter goal={goal} result={r} text={r.text} />);
    expect(screen.getByRole("region", { name: "Before: what you typed" }).textContent).toContain(goal);
    expect(screen.getByRole("region", { name: "After: your PromptPilot prompt" }).textContent).toMatch(/You are a learning coach/);
    const chips = screen.getByRole("list", { name: "What we added" });
    expect(chips.textContent).toMatch(/Expert role.*Success criterion.*Step-by-step workflow/);
  });
});
