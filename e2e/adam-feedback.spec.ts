import { expect, test } from "@playwright/test";

const NEWSLETTER = "help me write a weekly newsletter for my bakery customers about our new sourdough";

test.describe("user feedback 16 Nov", () => {
  test("homepage: bakery newsletter gets the newsletter template", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("What do you want AI to help you with?").fill(NEWSLETTER);
    await page.getByRole("button", { name: /Generate prompt/ }).click();
    const text = (await page.getByLabel("Generated prompt text").textContent()) ?? "";
    expect(text).toContain("Preview text");
    expect(text).not.toContain("1,200 words");
    expect(text).not.toMatch(/Add a meta description|internal-link ideas/i);
  });

  test("builder: detected category and task type are shown and editable", async ({ page }) => {
    await page.goto("/builder");
    await page.locator("#goal").fill(NEWSLETTER);
    await expect(page.locator("#cat")).toHaveValue("writing");
    await expect(page.locator("#sub")).toBeEnabled();
    await expect(page.locator("#sub")).toHaveValue("newsletter");
    await page.locator("#sub").selectOption("email");
    await expect(page.locator("#sub")).toHaveValue("email");
  });

  test("builder: Hinglish cafe poster for Midjourney keeps the cafe and the offer", async ({ page }) => {
    await page.goto("/builder");
    await page.locator("#goal").fill("mere cafe ke liye ek poster banao, Diwali offer 20% off");
    await page.getByRole("button", { name: /^Midjourney/ }).first().click();
    await page.getByRole("button", { name: /Generate prompt/ }).first().click();
    const text = (await page.getByLabel("Generated prompt text").textContent()) ?? "";
    expect(text).toContain("cafe");
    expect(text).toContain("20% off");
    expect(text).not.toContain("balcony");
  });
});
