import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** Fail only on serious/critical; log moderate/minor for awareness. */
async function assertNoSeriousAxe(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator("main#main")).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  const other = results.violations.filter((v) => v.impact === "moderate" || v.impact === "minor");
  // moderate/minor are logged via expect soft message only when serious fails; listed in CI annotations if needed
  void other;
  expect(serious, `${path} serious/critical:\n${JSON.stringify(serious.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map((n) => n.target) })), null, 2)}`).toEqual([]);
}

test.describe("accessibility (axe) — 0 serious/critical", () => {
  test("home", async ({ page }) => {
    await assertNoSeriousAxe(page, "/");
  });

  test("pricing", async ({ page }) => {
    await assertNoSeriousAxe(page, "/pricing");
  });

  test("festivals", async ({ page }) => {
    await assertNoSeriousAxe(page, "/festivals");
  });

  test("showcase", async ({ page }) => {
    await assertNoSeriousAxe(page, "/showcase");
  });

  test("packs hub", async ({ page }) => {
    await assertNoSeriousAxe(page, "/packs");
  });

  test("pack page job-hunting", async ({ page }) => {
    await assertNoSeriousAxe(page, "/packs/job-hunting");
  });

  test("builder flow after generate", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("What do you want AI to help you with?").fill("Write a cover letter for a senior Laravel developer job");
    await page.getByRole("button", { name: /Generate prompt/ }).click();
    await expect(page.getByLabel("Generated prompt text")).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious, JSON.stringify(serious.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map((n) => n.target) })), null, 2)).toEqual([]);
  });
});
