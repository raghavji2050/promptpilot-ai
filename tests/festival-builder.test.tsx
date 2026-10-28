// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams("goal=greeting"), usePathname: () => "/festivals/diwali", useRouter: () => ({ push: () => {} }) }));
vi.mock("@/lib/saved", () => ({ useSession: () => ({ session: null }) }));
import { FestivalBuilder, FestivalBuilderWithParams } from "@/components/FestivalBuilder";
import { FESTIVALS } from "@/lib/festivals";
import { festivalOptions } from "@/lib/festivals/ui";

afterEach(cleanup);
const opts = festivalOptions(FESTIVALS, "2026-10-18");
const out = () => screen.getByLabelText("Generated prompt text").textContent ?? "";

describe("FestivalBuilder", () => {
  it("lists upcoming festivals first and generates a festival prompt", () => {
    window.matchMedia = window.matchMedia || ((() => ({ matches: false, addEventListener() {}, removeEventListener() {} })) as never);
    render(<FestivalBuilder festivals={opts} initial={{ slug: "diwali" }} />);
    const sel = screen.getByLabelText("1. Festival") as HTMLSelectElement;
    expect(sel.options[0]!.textContent).toContain("Navratri");
    fireEvent.click(screen.getByLabelText("Greeting / wishes"));
    fireEvent.change(screen.getByLabelText("4. Language"), { target: { value: "Hindi" } });
    fireEvent.click(screen.getByRole("button", { name: /Create festival prompt/ }));
    expect(out()).toContain("Festival: Diwali");
    expect(out()).toContain("Devanagari");
    expect(screen.getByRole("heading", { name: "Write Diwali greetings in Hindi" })).toBeTruthy();
    // Change language rewrites the goal sentence too.
    fireEvent.change(screen.getByLabelText("Change language"), { target: { value: "Punjabi" } });
    expect(screen.getByRole("heading", { name: "Write Diwali greetings in Punjabi" })).toBeTruthy();
    expect(out()).toContain("Respond in Punjabi");
  });
  it("custom occasion requires a name", () => {
    render(<FestivalBuilder festivals={opts} />);
    fireEvent.change(screen.getByLabelText("1. Festival"), { target: { value: "custom" } });
    fireEvent.click(screen.getByRole("button", { name: /Create festival prompt/ }));
    expect(screen.getByRole("alert").textContent).toContain("Type the occasion");
    fireEvent.change(screen.getByLabelText("Occasion name"), { target: { value: "Onam" } });
    fireEvent.click(screen.getByRole("button", { name: /Create festival prompt/ }));
    expect(out()).toContain("Festival: Onam");
  });
  it("auto-generates from ?goal= on a studio page", () => {
    render(<FestivalBuilderWithParams festivals={opts} fallbackSlug="karwa-chauth" />);
    expect(out()).toContain("Festival: Karwa Chauth");
    expect(out()).toContain("6 greetings");
  });
});
