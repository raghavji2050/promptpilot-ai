// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TryInButtons } from "@/components/TryInButtons";

const PROMPT = "Line one\nLine two with \"quotes\" & <tags>";

function mockClipboard(impl: (t: string) => Promise<void>) {
  const writeText = vi.fn(impl);
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  return writeText;
}
const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("<TryInButtons>", () => {
  it("renders four accessible buttons", () => {
    render(<TryInButtons text={PROMPT} />);
    for (const n of ["ChatGPT", "Claude", "Gemini", "Grok"]) expect(screen.getByRole("button", { name: new RegExp(`Try in ${n}`) })).toBeTruthy();
    expect(screen.getByText(/You may need to paste it yourself/)).toBeTruthy();
  });

  it("success: copies, opens the official URL in a new tab and shows the toast", async () => {
    const writeText = mockClipboard(() => Promise.resolve());
    const win = { opener: {}, location: { href: "" } };
    const open = vi.spyOn(window, "open").mockReturnValue(win as unknown as Window);
    render(<TryInButtons text={PROMPT} />);
    fireEvent.click(screen.getByRole("button", { name: /Try in ChatGPT/ }));
    expect(open).toHaveBeenCalledTimes(1); // synchronous, inside the click
    expect(writeText).toHaveBeenCalledWith(PROMPT);
    expect(win.location.href).toBe("https://chatgpt.com/");
    expect(win.opener).toBeNull();
    await flush();
    expect(screen.getByRole("status").textContent).toContain("Prompt copied! Paste it into ChatGPT to try it.");
  });

  it("clipboard failure: shows a readonly, auto-selected textarea with the full prompt", async () => {
    mockClipboard(() => Promise.reject(new Error("denied")));
    vi.spyOn(window, "open").mockReturnValue({ opener: {}, location: { href: "" } } as unknown as Window);
    render(<TryInButtons text={PROMPT} />);
    fireEvent.click(screen.getByRole("button", { name: /Try in Gemini/ }));
    await flush();
    const ta = screen.getByLabelText("Prompt text to copy manually") as HTMLTextAreaElement;
    expect(ta.readOnly).toBe(true);
    expect(ta.value).toBe(PROMPT);
    expect(document.activeElement).toBe(ta);
    expect(ta.selectionStart).toBe(0);
    expect(ta.selectionEnd).toBe(PROMPT.length);
    expect(screen.getByRole("status").textContent).toMatch(/couldn't copy automatically/);
  });

  it("empty prompt: buttons are disabled with helper text and nothing happens", () => {
    const writeText = mockClipboard(() => Promise.resolve());
    const open = vi.spyOn(window, "open");
    render(<TryInButtons text="  " />);
    const btn = screen.getByRole("button", { name: /Try in Claude/ }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    fireEvent.click(btn);
    expect(open).not.toHaveBeenCalled();
    expect(writeText).not.toHaveBeenCalled();
    expect(screen.getByText("Generate a prompt first to try it in an AI app.")).toBeTruthy();
  });

  it("popup blocked: still copies and shows a plain link to the site", async () => {
    mockClipboard(() => Promise.resolve());
    vi.spyOn(window, "open").mockReturnValue(null);
    render(<TryInButtons text={PROMPT} />);
    fireEvent.click(screen.getByRole("button", { name: /Try in Grok/ }));
    await flush();
    expect(screen.getByRole("status").textContent).toMatch(/Prompt copied! Paste it into Grok to try it\. Your browser blocked the new tab/);
    const link = screen.getByRole("link", { name: "Open Grok" }) as HTMLAnchorElement;
    expect(link.href).toBe("https://grok.com/");
    expect(link.target).toBe("_blank");
    expect(link.rel).toContain("noopener");
  });
});
