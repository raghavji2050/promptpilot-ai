import { describe, expect, it } from "vitest";
import { MODELS, USE_CASES, buildImageReelPrompt, normaliseHinglish, type Model, type UseCase } from "@/lib/engine/image-reel";

describe("image-reel builder", () => {
  for (const uc of Object.keys(USE_CASES) as UseCase[]) for (const m of Object.keys(MODELS) as Model[]) {
    it(`${uc} x ${m}`, () => {
      const out = buildImageReelPrompt({ useCase: uc, model: m, subject: "Diwali sale", textOnImage: "Happy Diwali" });
      expect(out).toContain("Diwali sale");
      expect(out).toContain('"Happy Diwali"');
      if (m === "midjourney") { expect(out).toMatch(new RegExp(`--ar ${USE_CASES[uc].ar} --v 7 --style raw$`)); expect(out).not.toContain("\n"); }
      else if (m === "video") { expect(out).toMatch(/Shot 1 \(0-3s\)/); expect(out).toMatch(/Shot 3 \(6-10s\)/); expect(out).toContain("9:16"); expect(out).not.toContain("--"); }
      else { expect(out).not.toContain("--"); expect(out).not.toContain("Shot 1"); expect(out).toContain(`Aspect ratio ${USE_CASES[uc].ar}`); }
    });
  }
  it("is deterministic", () => {
    const i = { useCase: "shop-ad" as const, model: "gemini" as const, subject: "x" };
    expect(buildImageReelPrompt(i)).toBe(buildImageReelPrompt(i));
  });
  it("normalises Hinglish", () => {
    expect(normaliseHinglish("meri dukaan ke liye shaadi poster")).toBe("my shop for wedding poster");
    expect(buildImageReelPrompt({ useCase: "shaadi-invite", model: "dalle", subject: "dulhan aur dulha" })).toContain("bride and groom");
  });
});
