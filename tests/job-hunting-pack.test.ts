import { describe, expect, it } from "vitest";
import { JOB_HUNTING_PACK } from "@/content/job-hunting-pack";
import { buildUniversal, detectIntent } from "@/lib/engine/universal";

describe("Job Hunting pack", () => {
  it("has the six templates, each routed to its subcategory", () => {
    expect(JOB_HUNTING_PACK.map((t) => t.input.subcategoryId)).toEqual(["resume", "cover-letter", "interview-prep", "interview-prep", "salary-negotiation", "linkedin-summary"]);
    for (const t of JOB_HUNTING_PACK) expect(buildUniversal(t.input).sub?.id, t.id).toBe(t.input.subcategoryId);
  });
  it("is deterministic and carries the India rules and no-invention rule", () => {
    for (const t of JOB_HUNTING_PACK) {
      const a = buildUniversal(t.input).text;
      expect(buildUniversal(t.input).text).toBe(a);
      expect(a, t.id).toMatch(/LPA/);
      expect(a, t.id).toMatch(/notice period/i);
      expect(a, t.id).toMatch(/Naukri/);
      expect(a, t.id).toMatch(/never invent/i);
    }
  });
  it("routes each Hinglish example to the same subcategory", () => {
    for (const t of JOB_HUNTING_PACK) expect(detectIntent(t.hinglish)?.subcategoryId, t.hinglish).toBe(t.input.subcategoryId);
  });
  it("routes English job-hunting goals", () => {
    expect(detectIntent("Negotiate salary for my new offer")?.subcategoryId).toBe("salary-negotiation");
    expect(detectIntent("Write my LinkedIn summary")?.subcategoryId).toBe("linkedin-summary");
    expect(detectIntent("Ask my manager for a raise")?.subcategoryId).toBe("workplace-comms");
  });
});
