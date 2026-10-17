import { describe, expect, it } from "vitest";
import { analyzePrompt, shortenText, expandText, improveText, adaptText } from "@/lib/engine";

describe("analyzePrompt", () => {
  it("flags a weak prompt", () => {
    const a = analyzePrompt("write something good about marketing");
    expect(a.score).toBeLessThan(40);
    const ids = a.issues.map((i) => i.id);
    expect(ids).toContain("length");
    expect(ids).toContain("context");
    expect(a.issues[0].severity).toBe("high");
  });

  it("rewards a strong prompt", () => {
    const a = analyzePrompt(
      "Context: I'm a dentist in Mohali and my team wants more bookings. Write an Instagram caption for our customers announcing Sunday hours. Keep it under 50 words, avoid medical jargon, friendly tone. Format: caption plus 5 hashtags. Example: 'Smiles don't take weekends off…'",
    );
    expect(a.score).toBeGreaterThanOrEqual(90);
  });

  it("detects hype phrases", () => {
    const a = analyzePrompt("You are a world-class marketer with 30 years of experience. Write a slogan.");
    expect(a.issues.map((i) => i.id)).toContain("fluff");
  });

  it("empty prompt scores 0 and stats are zero", () => {
    const a = analyzePrompt("   ");
    expect(a.score).toBe(0);
    expect(a.stats.words).toBe(0);
  });

  it("approxTokens is chars/4 rounded up", () => {
    expect(analyzePrompt("abcdefgh").stats.approxTokens).toBe(2);
  });
});

describe("text transforms", () => {
  it("shortenText removes filler but keeps content", () => {
    const s = shortenText("Please, could you write a very short poem about rain? I want you to keep it simple.");
    expect(s).not.toMatch(/please|could you|i want you to|very/i);
    expect(s).toMatch(/poem about rain/);
  });

  it("expandText adds approach and checks, and placeholders for missing parts", () => {
    const e = expandText("Write a poem about rain", "chatgpt");
    expect(e).toContain("## Approach");
    expect(e).toContain("## Before answering, check");
    expect(e).toContain("[Add background");
  });

  it("improveText produces XML for Claude", () => {
    const i = improveText("Write a poem about rain", "claude");
    expect(i).toMatch(/<task>[\s\S]*<\/task>/);
    expect(i).toMatch(/<constraints>/);
  });

  it("adaptText converts markdown sections to XML and back", () => {
    const md = "## Task\nWrite a haiku\n\n## Constraints\n- 3 lines\n- About monsoon";
    const xml = adaptText(md, "claude");
    expect(xml).toContain("<task>\nWrite a haiku\n</task>");
    expect(xml).toContain("- About monsoon");
    const back = adaptText(xml, "chatgpt");
    expect(back).toContain("## Task");
    expect(back).toContain("- 3 lines");
  });

  it("transforms are deterministic", () => {
    const p = "please write something about stuff for my team";
    expect(improveText(p, "chatgpt")).toBe(improveText(p, "chatgpt"));
    expect(expandText(p, "claude")).toBe(expandText(p, "claude"));
  });
});
