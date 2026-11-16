// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("3. builder shows the detected category and task type", () => {
  it("pre-fills both selects after auto-detect and lets the user change the task type", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ available: { text: false, image: false }, turnstileSiteKey: null, limits: { text: 0, image: 0 }, tier: "anon", providers: [] }), { status: 200 })));
    const { UniversalBuilder } = await import("@/components/UniversalBuilder");
    render(<UniversalBuilder />);
    const cat = screen.getByLabelText("3. Category") as HTMLSelectElement;
    const sub = screen.getByLabelText("Task type") as HTMLSelectElement;
    expect(sub.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/What do you want AI to help you with/), { target: { value: "help me write a weekly newsletter for my bakery customers about our new sourdough" } });
    expect(cat.value).toBe("writing");
    expect(sub.disabled).toBe(false);
    expect(sub.value).toBe("newsletter");
    expect(sub.selectedOptions[0]!.textContent).toBe("Newsletter / customer update");
    fireEvent.change(sub, { target: { value: "email" } });
    expect(sub.value).toBe("email");
    expect(cat.value).toBe("writing");
    expect(screen.getByText(/Emails & professional messages/, { selector: "strong" })).toBeTruthy();
  });
});
