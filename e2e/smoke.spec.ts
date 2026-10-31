import { expect, test } from "@playwright/test";

test.describe("home → build prompt → copy", () => {
  test("generates a prompt and copies it", async ({ page, context, browserName }) => {
    if (browserName === "chromium") await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Get a prompt that actually works");

    await page.getByLabel("What do you want AI to help you with?").fill("Write a cover letter for a senior Laravel developer job");
    await page.getByRole("button", { name: /Generate prompt/ }).click();

    const output = page.getByLabel("Generated prompt text");
    await expect(output).toBeVisible();
    const text = (await output.textContent()) ?? "";
    expect(text.length).toBeGreaterThan(80);
    expect(text.toLowerCase()).toContain("laravel");

    await page.getByRole("button", { name: "Copy prompt" }).click();
    await expect(page.getByText("Prompt copied").first()).toBeVisible();
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip.trim()).toBe(text.trim());
  });

  test("empty goal does not produce a prompt", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Generate prompt/ }).click();
    await expect(page.getByLabel("Generated prompt text")).toHaveCount(0);
  });
});

test("pricing page is honest (no payment buttons)", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Free now. Pro coming soon.");
  await expect(page.getByRole("button", { name: /buy|checkout|subscribe|pay now/i })).toHaveCount(0);
});

test("festivals page renders", async ({ page }) => {
  await page.goto("/festivals");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Festival prompts for India");
});

test("health endpoint returns booleans only", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.ok).toBe(true);
  expect(JSON.stringify(body)).not.toMatch(/sk-|eyJ|gsk_/);
});
