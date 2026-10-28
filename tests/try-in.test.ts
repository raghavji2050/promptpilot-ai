import { describe, expect, it, vi } from "vitest";
import { TRY_PLATFORMS, getTryPlatform, launchTry, successMessage } from "@/lib/try-in";

const fakeWin = () => ({ opener: {} as unknown, location: { href: "" } }) as unknown as Window & { location: { href: string } };
const PROMPT = "## Role\nYou are a coach.\n\n- Tabs\tand \"quotes\" & <xml> ✓ हिन्दी";

describe("Try in AI platforms: logic", () => {
  it("uses the official URLs and never puts the prompt in the URL", () => {
    expect(TRY_PLATFORMS.map((p) => p.url)).toEqual(["https://chatgpt.com/", "https://claude.ai/new", "https://gemini.google.com/app", "https://grok.com/"]);
    for (const p of TRY_PLATFORMS) expect(p.url).not.toMatch(/[?#]/);
  });

  it("success: copies the exact text (line breaks and special characters preserved), opens the site and cuts the opener", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const w = fakeWin();
    const open = vi.fn().mockReturnValue(w);
    const r = launchTry(PROMPT, getTryPlatform("claude")!, { writeText, open });
    expect(r.status).toBe("launched");
    if (r.status !== "launched") return;
    expect(writeText).toHaveBeenCalledWith(PROMPT);
    expect(writeText.mock.invocationCallOrder[0]!).toBeLessThan(open.mock.invocationCallOrder[0]!);
    expect(open).toHaveBeenCalledWith("", "_blank");
    expect(w.opener).toBeNull();
    expect(w.location.href).toBe("https://claude.ai/new");
    expect(r.opened).toBe(true);
    await expect(r.copied).resolves.toBe(true);
    expect(successMessage(r.platform)).toBe("Prompt copied! Paste it into Claude to try it.");
  });

  it("clipboard failure: still opens the site and reports copied=false", async () => {
    const r = launchTry(PROMPT, TRY_PLATFORMS[0]!, { writeText: vi.fn().mockRejectedValue(new Error("denied")), open: () => fakeWin() });
    if (r.status !== "launched") throw new Error("expected launch");
    expect(r.opened).toBe(true);
    await expect(r.copied).resolves.toBe(false);
  });

  it("clipboard API missing or throwing synchronously: copied=false", async () => {
    const a = launchTry(PROMPT, TRY_PLATFORMS[0]!, { open: () => fakeWin() });
    const b = launchTry(PROMPT, TRY_PLATFORMS[0]!, { writeText: () => { throw new Error("sync"); }, open: () => fakeWin() });
    if (a.status !== "launched" || b.status !== "launched") throw new Error("expected launch");
    await expect(a.copied).resolves.toBe(false);
    await expect(b.copied).resolves.toBe(false);
  });

  it("empty prompt: does nothing", () => {
    const writeText = vi.fn(); const open = vi.fn();
    expect(launchTry("   \n", TRY_PLATFORMS[0]!, { writeText, open })).toEqual({ status: "empty" });
    expect(writeText).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
  });

  it("popup blocked (window.open returns null or throws): opened=false, copy still attempted", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const r1 = launchTry(PROMPT, TRY_PLATFORMS[3]!, { writeText, open: () => null });
    const r2 = launchTry(PROMPT, TRY_PLATFORMS[3]!, { writeText, open: () => { throw new Error("blocked"); } });
    if (r1.status !== "launched" || r2.status !== "launched") throw new Error("expected launch");
    expect(r1.opened).toBe(false);
    expect(r2.opened).toBe(false);
    await expect(r1.copied).resolves.toBe(true);
  });
});
