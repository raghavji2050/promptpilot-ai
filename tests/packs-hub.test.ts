import { describe, expect, it } from "vitest";
import { PACKS } from "@/content/packs";

describe("packs hub", () => {
  it("lists job hunting with a real count", () => {
    expect(PACKS[0]!.href).toBe("/packs/job-hunting");
    expect(PACKS[0]!.count).toBe(6);
  });
});
