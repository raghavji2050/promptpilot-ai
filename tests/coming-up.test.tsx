// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ComingUpInIndia } from "@/components/ComingUpInIndia";
import { FESTIVALS } from "@/lib/festivals";

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("ComingUpInIndia", () => {
  it("uses the IST date, not UTC: 20:00 UTC on 7 Nov is Diwali day in India", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-07T20:00:00Z"));
    render(<ComingUpInIndia festivals={FESTIVALS} serverToday="2026-11-07" />);
    expect(screen.getByRole("heading", { name: "Diwali" })).toBeTruthy();
    expect(screen.getByLabelText(/Countdown: Today/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Create Festival Content" })).toBeTruthy();
  });
  it("never shows an expired festival and labels provisional dates", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-30T06:00:00Z"));
    const { container } = render(<ComingUpInIndia festivals={FESTIVALS} serverToday="2026-10-30" />);
    expect(container.textContent).not.toContain("Karwa Chauth");
    expect(screen.getByRole("heading", { name: "Dhanteras" })).toBeTruthy();
    expect(container.textContent).toContain("Provisional");
    expect(screen.getByLabelText("Countdown: In 7 days (India time)")).toBeTruthy();
  });
  it("renders nothing when no future festival is known", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2030-06-01T00:00:00Z"));
    const { container } = render(<ComingUpInIndia festivals={FESTIVALS.filter((f) => !f.fixed)} serverToday="2030-06-01" />);
    expect(container.innerHTML).toBe("");
  });
});
