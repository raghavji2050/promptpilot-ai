// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ThemeToggle, THEME_KEY } from "@/components/ui/ThemeToggle";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Input";
import { ResultsPanel } from "@/components/ResultsPanel";
import { HeroBuilder, HERO_EXAMPLES } from "@/components/HeroBuilder";
import type { UniversalInput } from "@/lib/engine";
import { useState } from "react";

vi.mock("next/link", () => ({ default: ({ href, children, ...p }: { href: string; children: React.ReactNode }) => <a href={href} {...p}>{children}</a> }));
afterEach(() => { cleanup(); document.documentElement.classList.remove("dark"); localStorage.clear(); });

Object.defineProperty(window, "matchMedia", { configurable: true, value: (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }) });

describe("ThemeToggle", () => {
  it("toggles the dark class and remembers the choice", async () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole("button", { name: /switch to dark theme/i });
    fireEvent.click(btn);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem(THEME_KEY)).toBe("dark");
    fireEvent.click(await screen.findByRole("button", { name: /switch to light theme/i }));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem(THEME_KEY)).toBe("light");
  });
});

describe("Toast", () => {
  it("announces messages in a polite live region and auto-dismisses", () => {
    vi.useFakeTimers();
    function Btn() { const t = useToast(); return <button onClick={() => t("Saved!")}>go</button>; }
    render(<ToastProvider><Btn /></ToastProvider>);
    fireEvent.click(screen.getByText("go"));
    const region = screen.getByRole("status");
    expect(region.getAttribute("aria-live")).toBe("polite");
    expect(region.textContent).toContain("Saved!");
    act(() => { vi.advanceTimersByTime(4000); });
    expect(region.textContent).not.toContain("Saved!");
    vi.useRealTimers();
  });
});

describe("Form primitives", () => {
  it("Input and Select are labelled and wire hints with aria-describedby", () => {
    render(<><Input label="Your name" hint="As shown on your CV" /><Select label="Platform" options={[{ value: "a", label: "A" }]} /></>);
    const input = screen.getByLabelText("Your name");
    expect(input.getAttribute("aria-describedby")).toBeTruthy();
    expect(document.getElementById(input.getAttribute("aria-describedby")!)?.textContent).toBe("As shown on your CV");
    expect(screen.getByLabelText("Platform").tagName).toBe("SELECT");
  });
  it("EmptyState renders title, body and action", () => {
    render(<EmptyState title="Nothing here" action={<button>Do it</button>}>Body text</EmptyState>);
    expect(screen.getByRole("heading", { name: "Nothing here" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Do it" })).toBeTruthy();
  });
});

function Harness() {
  const [input, setInput] = useState<UniversalInput>({ goal: "Help me prepare for a job interview", targetId: "claude", mode: "standard", extra: {} });
  return <ResultsPanel input={input} onChange={(p) => setInput((c) => ({ ...c, ...p }))} />;
}

describe("ResultsPanel", () => {
  const promptText = () => screen.getByLabelText("Generated prompt text").textContent ?? "";
  it("shows title, platform, prompt, copy and try buttons", () => {
    render(<Harness />);
    expect(screen.getByRole("heading", { name: "Help me prepare for a job interview" })).toBeTruthy();
    expect(screen.getByText(/For Claude/)).toBeTruthy();
    expect(promptText().length).toBeGreaterThan(200);
    expect(screen.getByRole("button", { name: /Copy prompt/ })).toBeTruthy();
    for (const n of ["ChatGPT", "Claude", "Gemini", "Grok"]) expect(screen.getByRole("button", { name: new RegExp(`Try in ${n}`) })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Log in to save" })).toBeTruthy();
  });
  it("Make shorter / Make more detailed / Improve / Regenerate change the prompt", () => {
    render(<Harness />);
    const base = promptText();
    fireEvent.click(screen.getByRole("button", { name: "Make shorter" }));
    const shorter = promptText();
    expect(shorter.length).toBeLessThan(base.length);
    fireEvent.click(screen.getByRole("button", { name: "Make more detailed" }));
    expect(promptText().length).toBeGreaterThan(base.length);
    fireEvent.click(screen.getByRole("button", { name: "Make more detailed" }));
    fireEvent.click(screen.getByRole("button", { name: "Improve" }));
    expect(promptText()).not.toBe(base);
    fireEvent.click(screen.getByRole("button", { name: "Improve" }));
    fireEvent.click(screen.getByRole("button", { name: /Regenerate/ }));
    expect(promptText()).not.toBe(base);
  });
});

describe("HeroBuilder", () => {
  it("validates empty input, then generates inline from a clicked example", () => {
    render(<HeroBuilder platforms={[{ id: "chatgpt", name: "ChatGPT" }, { id: "gemini", name: "Gemini" }]} />);
    fireEvent.click(screen.getByRole("button", { name: /Generate prompt/ }));
    expect(screen.getByRole("alert").textContent).toMatch(/Tell us what you want/);
    expect(screen.queryByLabelText("Generated prompt text")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: HERO_EXAMPLES[2].label }));
    expect((screen.getByLabelText("What do you want AI to help you with?") as HTMLTextAreaElement).value).toBe(HERO_EXAMPLES[2].goal);
    expect(screen.getByLabelText("Generated prompt text").textContent!.length).toBeGreaterThan(100);
    expect(screen.getByText(/For ChatGPT/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("AI platform"), { target: { value: "gemini" } });
    expect(screen.getByText(/For Gemini/)).toBeTruthy();
  });
});
