import { expect, test } from "@playwright/test";

test("image & reel builder switches format per model", async ({ page }) => {
  await page.goto("/image-reel-builder");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Image & Reel prompt builder");
  const out = page.getByTestId("ir-output");
  await expect(out).toContainText("--ar 4:5 --v 7");
  await page.getByLabel("Model").selectOption("gemini");
  await expect(out).not.toContainText("--ar");
  await page.getByLabel("Use case").selectOption("instagram-reel");
  await page.getByLabel("Model").selectOption("video");
  await expect(out).toContainText("Shot 1 (0-3s)");
  await page.getByLabel("Subject").fill("meri dukaan ka naya kapde collection");
  await expect(out).toContainText("my shop");
});

test("gallery vs builder landing links to builder", async ({ page }) => {
  await page.goto("/image-prompt-builder");
  await expect(page.locator('a[href="https://prompthero.com/"]')).toBeVisible();
  await page.getByRole("link", { name: /Open the Image & Reel builder/ }).click();
  await expect(page).toHaveURL(/image-reel-builder/);
});

test("showcase cards open prefilled builders", async ({ page }) => {
  await page.goto("/showcase");
  await expect(page.getByTestId("showcase-card")).toHaveCount(6);
  await expect(page.getByText("Example output").first()).toBeVisible();
  await page.getByTestId("showcase-card").nth(3).getByRole("link", { name: "Try this prompt" }).click();
  await expect(page).toHaveURL(/image-reel-builder\?/);
  await expect(page.getByTestId("ir-output")).toContainText("Shot 1 (0-3s)");
  await expect(page.getByTestId("ir-output")).toContainText("chai cafe");
});

test("App Builder showcase cards link to pack or builder", async ({ page }) => {
  await page.goto("/showcase");
  const game = page.getByTestId("showcase-card").filter({ hasText: "Browser game" });
  await expect(game.getByText("make a browser game")).toBeVisible();
  await expect(game.getByTestId("showcase-built")).toContainText("Stack:");
  await game.getByRole("link", { name: "Try this prompt" }).click();
  await expect(page).toHaveURL(/\/(packs\/app-builder|builder\?)/);
});
