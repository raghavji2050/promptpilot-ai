import { describe, it, expect } from "vitest";
import { assertAffected, friendlyDbError, isSessionExpiredError, isSessionLive, ownedOnly, SESSION_EXPIRED_MSG } from "@/lib/saved-guards";

describe("saved-prompt guards", () => {
  it("detects expired / invalid sessions", () => {
    expect(isSessionExpiredError({ message: "JWT expired", code: "PGRST301" })).toBe(true);
    expect(isSessionExpiredError({ message: "x", status: 401 })).toBe(true);
    expect(isSessionExpiredError({ message: "Invalid Refresh Token: Refresh Token Not Found" })).toBe(true);
    expect(isSessionExpiredError({ message: "Auth session missing!" })).toBe(true);
    expect(isSessionExpiredError({ message: "FREE_SAVE_LIMIT" })).toBe(false);
    expect(isSessionExpiredError(null)).toBe(false);
  });
  it("friendly messages", () => {
    expect(friendlyDbError("JWT expired")).toBe(SESSION_EXPIRED_MSG);
    expect(friendlyDbError("TypeError: Failed to fetch")).toMatch(/connection/);
    expect(friendlyDbError("NOT_FOUND")).toMatch(/not yours/);
    expect(friendlyDbError("other")).toBe("other");
  });
  it("ownedOnly drops other users' rows (e.g. public prompts allowed by RLS select)", () => {
    const rows = [{ id: "1", user_id: "me" }, { id: "2", user_id: "other" }, { id: "3" }];
    expect(ownedOnly(rows, "me").map((r) => r.id)).toEqual(["1"]);
  });
  it("isSessionLive respects expires_at", () => {
    expect(isSessionLive(null)).toBe(false);
    expect(isSessionLive({ expires_at: 100 }, 99_000)).toBe(true);
    expect(isSessionLive({ expires_at: 100 }, 100_001)).toBe(false);
    expect(isSessionLive({})).toBe(true);
  });
  it("assertAffected throws when no row matched", () => {
    expect(() => assertAffected([])).toThrow(/not yours/);
    expect(() => assertAffected(null)).toThrow();
    expect(() => assertAffected([{ id: "1" }])).not.toThrow();
  });
});
