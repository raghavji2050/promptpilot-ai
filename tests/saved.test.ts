import { describe, it, expect } from "vitest";
import { dbTargetId, friendlyDbError } from "@/lib/saved";
import { TARGETS } from "@/lib/engine";

describe("saved prompt DB mapping", () => {
  it("maps app targets missing from public.targets to null (FK safety)", () => {
    expect(dbTargetId("chatgpt")).toBe("chatgpt");
    expect(dbTargetId("claude-code")).toBe("claude-code");
    expect(dbTargetId("video")).toBeNull();
    expect(dbTargetId("image-generic")).toBeNull();
    expect(dbTargetId(undefined)).toBeNull();
    for (const t of TARGETS) expect([t.id, null]).toContain(dbTargetId(t.id));
  });
  it("translates schema error codes", () => {
    expect(friendlyDbError("P0001: FREE_SAVE_LIMIT")).toMatch(/25/);
    expect(friendlyDbError("AUTH_REQUIRED")).toMatch(/sign in/i);
  });
});
