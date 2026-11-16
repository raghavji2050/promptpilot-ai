/** Regression tests for the 16 Nov user feedback (exact inputs from the report). */
import { describe, expect, it } from "vitest";
import { buildUniversal, detectIntent, slotStates, statedDetails } from "@/lib/engine";
import { GENERIC_BLOCK } from "@/lib/engine/expert";
import { detectFestivalIntent } from "@/lib/engine/festival";
import { groq, workersText, gemini, SYSTEM } from "@/lib/run/providers";

const NEWSLETTER = "help me write a weekly newsletter for my bakery customers about our new sourdough";
const MONTHLY = "Write a monthly update for our 40 past clients. We are a small interior design studio in Pune. This month we finished a 2BHK renovation in Baner, we have 2 project slots open for December, and we are offering a free 30-minute consultation. Keep it warm but professional, under 250 words, plain text, with one clear call to action to book a call.";
const CAFE = "mere cafe ke liye ek poster banao, Diwali offer 20% off";
const build = (goal: string, targetId = "chatgpt") => buildUniversal({ goal, targetId, mode: "standard", extra: {} });

describe("1. newsletter routing", () => {
  it("routes the bakery newsletter to the newsletter template, not the SEO article", () => {
    const r = build(NEWSLETTER);
    expect(r.sub?.id).toBe("newsletter");
    expect(r.sub?.name).toBe("Newsletter / customer update");
    expect(r.text).toMatch(/Subject line/);
    expect(r.text).toMatch(/Preview text/);
    expect(r.text).toMatch(/one call to action/i);
    expect(r.text).not.toMatch(/1,200 words|meta description \(|internal-link ideas|SEO content strategist/i);
  });
  it("routes customer/client update emails to newsletter", () => {
    expect(detectIntent("Send an update email to our customers about new opening hours")?.subcategoryId).toBe("newsletter");
    expect(detectIntent("monthly mailer for my salon clients")?.subcategoryId).toBe("newsletter");
  });
  it("keeps blogs, SEO articles and one-to-one emails where they were", () => {
    expect(detectIntent("Write a blog post about choosing a first electric scooter")?.subcategoryId).toBe("blog-newsletter");
    expect(detectIntent("Write an SEO article for my newsletter about sourdough")?.subcategoryId).toBe("blog-newsletter");
    expect(detectIntent("Write an email to my manager asking for two days of leave")?.subcategoryId).toBe("email");
    expect(detectIntent("Write a cold email to potential clients")?.subcategoryId).toBe("email");
  });
});

describe("2. stated details beat missing-detail defaults", () => {
  it("carries audience and length from the long monthly-email request", () => {
    const r = build(MONTHLY);
    expect(MONTHLY.length).toBeGreaterThan(300);
    expect(r.text).not.toMatch(/a general audience/);
    expect(r.text).not.toMatch(/a concise, structured answer with headings/);
    expect(r.text).toMatch(/our 40 past clients/);
    expect(r.text).toMatch(/Length: under 250 words, as I asked/);
    expect(r.text).not.toMatch(/150–250 words|Under 150 words/);
    expect(r.missing.map((m) => m.key)).not.toContain("format");
    expect(r.missing.map((m) => m.key)).not.toContain("recipient");
  });
  it("the generic template does not assume audience or format when the goal states them", () => {
    const st = slotStates({ goal: MONTHLY, targetId: "chatgpt" }, GENERIC_BLOCK);
    const missing = st.filter((x) => !x.value && !x.detected).map((x) => x.slot.key);
    expect(missing).not.toContain("audience");
    expect(missing).not.toContain("format");
  });
  it("a stated word limit replaces the template's own (email: Under 150 words)", () => {
    const r = build("Write an email to my manager asking for two days of leave, under 100 words");
    expect(r.text).toMatch(/Length: under 100 words, as I asked/);
    expect(r.text).not.toMatch(/Under 150 words/);
    expect(r.text).not.toMatch(/Recipient and relationship: my manager, a professional/);
  });
  it("extracts stated details", () => {
    expect(statedDetails(MONTHLY)).toMatchObject({ audience: "our 40 past clients", length: "under 250 words", format: "plain text", tone: "warm but professional" });
    expect(statedDetails("Help me grow my Instagram account")).toEqual({});
  });
  it("short goals still get assumptions", () => {
    expect(build("Write an email asking for a deadline extension").text).toMatch(/If details are missing/);
  });
});

describe("4. Hinglish festival poster keeps the subject and the offer", () => {
  it("detects the cafe and the offer from Hinglish", () => {
    expect(detectFestivalIntent(CAFE)?.extra).toMatchObject({ festival: "diwali", fgoal: "image", business: "cafe", offer: "Diwali offer 20% off" });
  });
  it("Midjourney prompt shows a cafe decorated for Diwali with the offer, not a balcony", () => {
    const r = build(CAFE, "midjourney");
    expect(r.kind).toBe("image");
    expect(r.text).toMatch(/cafe/);
    expect(r.text).toMatch(/coffee/);
    expect(r.text).toMatch(/"Diwali offer 20% off"/);
    expect(r.text).not.toMatch(/balcony/);
    expect(r.text).not.toMatch(/--no text,/);
    expect(r.warnings.join(" ")).toMatch(/offer is written into the prompt/);
  });
  it("English business requests also keep the setting; no-business requests are unchanged", () => {
    expect(build("Diwali poster for my bakery in Pune", "midjourney").text).toMatch(/bakery counter/);
    const plain = build("Diwali poster", "midjourney").text;
    expect(plain).toMatch(/^a Diwali scene/);
    expect(plain).toMatch(/--no text, letters/);
  });
});

describe("5. Run free: no-invention rule first", () => {
  it("system instructions start with the no-invention rule and ask for placeholders/questions", () => {
    expect(SYSTEM.split("\n")[0]).toMatch(/^Rule 1, above everything else: never invent facts/);
    expect(SYSTEM).toMatch(/\[detail\]/);
    expect(SYSTEM).toMatch(/ask up to 3 short questions/);
    expect(SYSTEM.indexOf("never invent")).toBeLessThan(SYSTEM.indexOf("carry out the user's prompt"));
  });
  it("every text provider sends that system prompt", async () => {
    const bodies: string[] = [];
    const f = (async (_u: string, init?: RequestInit) => {
      bodies.push(String(init?.body));
      return new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }], result: { response: "ok" }, candidates: [{ content: { parts: [{ text: "ok" }] } }] }), { status: 200 });
    }) as unknown as typeof fetch;
    const env = { GROQ_API_KEY: "k", CLOUDFLARE_ACCOUNT_ID: "a".repeat(32), CLOUDFLARE_API_TOKEN: "t", GEMINI_API_KEY: "g", RUN_ENABLE_GEMINI: "1" };
    for (const p of [groq(env), workersText(env), gemini(env, "IN")]) await p!.run("Write a newsletter", f);
    expect(bodies).toHaveLength(3);
    for (const b of bodies) expect(b).toContain("Rule 1, above everything else: never invent facts");
    expect(JSON.parse(bodies[0]!).temperature).toBeLessThanOrEqual(0.4);
  });
  it("text prompts list the no-invention constraint first", () => {
    const r = build(NEWSLETTER);
    const c = r.sections.find((s) => s.id === "constraints")!;
    expect(c.lines[0]).toMatch(/^Don't invent facts/);
  });
});
