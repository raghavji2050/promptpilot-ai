import { describe, expect, it } from "vitest";
import { CARD_SIZES, cardUrl, clip, intentUrl, isCardSize, sharedLink, shareText, utmParams } from "@/lib/share";
import { fromShareParams, type UniversalInput } from "@/lib/engine";

const plain: UniversalInput = { goal: "write a cover letter", targetId: "claude", categoryId: "career" };
const fest: UniversalInput = { goal: "Diwali greetings for my clients", targetId: "chatgpt", language: "Hindi", extra: { festival: "diwali", fgoal: "greeting", business: "CA firm & co" } };

describe("social sharing helpers", () => {
  it("card sizes match the spec", () => {
    expect(CARD_SIZES.square).toMatchObject({ width: 1080, height: 1080 });
    expect(CARD_SIZES.story).toMatchObject({ width: 1080, height: 1920 });
    expect(CARD_SIZES.wide).toMatchObject({ width: 1200, height: 630 });
    expect(isCardSize("story")).toBe(true); expect(isCardSize("huge")).toBe(false);
  });
  it("UTM tags by channel, campaign and content", () => {
    expect(Object.fromEntries(utmParams(plain, "x"))).toEqual({ utm_source: "x", utm_medium: "social", utm_campaign: "prompt_share", utm_content: "career" });
    expect(Object.fromEntries(utmParams(fest, "whatsapp"))).toMatchObject({ utm_source: "whatsapp", utm_campaign: "festival_share", utm_content: "diwali" });
    expect(utmParams({ ...fest, extra: { festival: "custom" } }, "copy").get("utm_medium")).toBe("referral");
    expect(utmParams({ goal: "x", targetId: "chatgpt" }, "facebook").get("utm_content")).toBe("general");
  });
  it("shared link round-trips the prompt and carries UTMs", () => {
    const u = new URL(sharedLink("https://example.com/", fest, "linkedin"));
    expect(u.pathname).toBe("/builder");
    expect(u.searchParams.get("utm_source")).toBe("linkedin");
    const back = fromShareParams((k) => u.searchParams.get(k), u.searchParams.keys());
    expect(back.goal).toBe(fest.goal); expect(back.language).toBe("Hindi");
    expect(back.extra).toEqual(fest.extra); // utm_* never leak into the prompt
  });
  it("card URLs", () => {
    const u = new URL(cardUrl(fest, "story", { download: true, origin: "https://example.com" }));
    expect(u.pathname).toBe("/api/card"); expect(u.searchParams.get("size")).toBe("story"); expect(u.searchParams.get("dl")).toBe("1");
    expect(cardUrl(plain, "wide").startsWith("/api/card?")).toBe(true);
    expect(cardUrl(plain, "wide")).not.toContain("dl=");
  });
  it("intent URLs use each network's official share endpoint and encode safely", () => {
    const link = "https://example.com/builder?goal=a&b=c";
    expect(intentUrl("x", link, "Hi & bye")).toBe(`https://twitter.com/intent/tweet?text=Hi%20%26%20bye&url=${encodeURIComponent(link)}`);
    expect(intentUrl("linkedin", link, "t")).toBe(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`);
    expect(intentUrl("facebook", link, "t")).toBe(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`);
    const wa = new URL(intentUrl("whatsapp", link, "Look"));
    expect(wa.host).toBe("wa.me"); expect(wa.searchParams.get("text")).toBe(`Look ${link}`);
  });
  it("share text makes no claims", () => {
    for (const t of [shareText(plain), shareText(fest, "Diwali")]) expect(t).not.toMatch(/\d|best|viral|trending|guarantee/i);
    expect(shareText(fest, "Diwali")).toContain("Diwali");
  });
  it("clip", () => { expect(clip("abcdef", 4)).toBe("abc…"); expect(clip("abc", 4)).toBe("abc"); });
});
