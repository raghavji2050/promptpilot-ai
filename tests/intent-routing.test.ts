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
  it("routes bug symptoms (runs twice / job fails) to coding/debugging, not the app-build prompt", () => {
    for (const g of ["Laravel queue job runs twice", "My cron job runs twice", "Why does my Laravel queue job fail", "React useEffect runs twice"]) {
      expect(detectIntent(g), g).toMatchObject({ categoryId: "coding", subcategoryId: "debugging" });
    }
  });
  it("still routes app builds to build-app", () => {
    expect(detectIntent("Build a Laravel SaaS web app")).toMatchObject({ categoryId: "coding", subcategoryId: "build-app" });
  });
});
