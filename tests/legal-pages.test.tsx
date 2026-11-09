// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import PrivacyPage from "@/app/privacy/page";
import TermsPage from "@/app/terms/page";

vi.mock("next/link", () => ({ default: ({ href, children, ...p }: { href: string; children: React.ReactNode }) => <a href={href} {...p}>{children}</a> }));
afterEach(() => cleanup());

describe("Day 14 legal pages", () => {
  it("privacy covers Run providers, hashed counters, logs and Vercel Web Analytics", () => {
    const { container } = render(<PrivacyPage />);
    const text = container.textContent ?? "";
    expect(text).toContain("Groq");
    expect(text).toContain("Cloudflare Workers AI");
    expect(text).toContain("Turnstile");
    expect(text).toMatch(/hash of your IP address/);
    expect(text).toContain("Vercel Web Analytics");
    expect(text).toMatch(/Prompt text is not written/);
    // The old line claimed no analytics at all, which became false once <Analytics /> shipped.
    expect(text).not.toContain("does not include third-party analytics");
    expect(container.querySelector("#run")).not.toBeNull();
  });

  it("terms cover Run fair use and link to privacy and contact", () => {
    const { container } = render(<TermsPage />);
    const text = container.textContent ?? "";
    expect(text).toMatch(/Run button and fair use/);
    expect(text).toMatch(/daily limits/);
    expect(container.querySelector('a[href="/privacy"]')).not.toBeNull();
    expect(container.querySelector('a[href="/contact"]')).not.toBeNull();
  });
});
