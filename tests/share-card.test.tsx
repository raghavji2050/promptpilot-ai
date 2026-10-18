// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ShareCard } from "@/components/ShareCard";

describe("ShareCard", () => {
  it("renders sizes, download and intent links with UTMs", () => {
    render(<ShareCard input={{ goal: "Diwali post for my bakery", targetId: "chatgpt", extra: { festival: "diwali", fgoal: "social-post" } }} festivalName="Diwali" />);
    fireEvent.click(screen.getByRole("button", { name: "Share as image" }));
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toContain("/api/card?");
    expect(img.getAttribute("src")).toContain("size=square");
    fireEvent.click(screen.getByLabelText("Story"));
    expect(screen.getByRole("img").getAttribute("src")).toContain("size=story");
    const dl = screen.getByRole("link", { name: "Download image" });
    expect(dl.getAttribute("href")).toContain("dl=1"); expect(dl.hasAttribute("download")).toBe(true);
    for (const [name, host] of [["X", "twitter.com"], ["LinkedIn", "linkedin.com"], ["WhatsApp", "wa.me"], ["Facebook", "facebook.com"]]) {
      const a = screen.getByRole("link", { name: new RegExp(`^${name}`) });
      const href = decodeURIComponent(a.getAttribute("href")!);
      expect(href).toContain(host); expect(href).toContain("utm_campaign=festival_share");
      expect(a.getAttribute("rel")).toContain("noopener");
    }
    expect(screen.queryByRole("button", { name: "Share…" })).toBeNull(); // no Web Share in jsdom
  });
  it("renders nothing without a goal", () => {
    const { container } = render(<ShareCard input={{ goal: " ", targetId: "chatgpt" }} />);
    expect(container.innerHTML).toBe("");
  });
});
