import { describe, expect, it } from "vitest";
import { detectIntent } from "@/lib/engine/universal";

describe("intent routing regressions (Day 2)", () => {
  it("routes resume summaries to career/resume", () => {
    expect(detectIntent("Resume summary for a data analyst")).toMatchObject({ categoryId: "career", subcategoryId: "resume" });
  });
  it("routes a Laravel bug fix to coding/debugging", () => {
    expect(detectIntent("Laravel API bug fix")).toMatchObject({ categoryId: "coding", subcategoryId: "debugging" });
  });
  it("still routes plain summaries to writing", () => {
    expect(detectIntent("Summarize this article in 5 bullets")?.categoryId).toBe("writing");
  });
});
