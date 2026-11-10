import { test, expect } from "@playwright/test";

test("agent builder: empty state, example fills, output + export tabs", async ({ page }) => {
  await page.goto("/agent-builder");
  await expect(page.getByRole("heading", { level: 1, name: "AI Agent Prompt Builder" })).toBeVisible();
  await expect(page.getByTestId("pp2-tagline")).toContainText("build intelligent AI agents");
  await expect(page.getByTestId("agent-empty")).toBeVisible();
  await page.getByRole("button", { name: /Fill an example/ }).click();
  const out = page.getByTestId("agent-output");
  await expect(out).toContainText("# Shop Helper");
  await expect(out).toContainText("Never ask for card numbers");
  await page.getByLabel("Agent name").fill("Bakery Bot");
  await expect(out).toContainText("# Bakery Bot");
  await expect(page.getByRole("button", { name: "Copy instructions" })).toBeEnabled();
  await expect(page.getByRole("tab").first()).toBeVisible();
  const sdk = page.getByTestId("agent-sdk");
  await expect(sdk).toContainText("from '@openai/agents'");
  await expect(sdk).toContainText('name: "Bakery Bot"');
  await page.getByRole("button", { name: "Python" }).click();
  await expect(sdk).toContainText("from agents import Agent, Runner");
});
