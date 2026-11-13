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

  test("exports SKILL.md and copies per-app snippets", async ({ page, context, browserName }) => {
    if (browserName === "chromium") await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");
    await page.getByLabel("What do you want AI to help you with?").fill("Fix a Laravel bug where the queue job runs twice");
    await page.getByRole("button", { name: /Generate prompt/ }).click();
    const prompt = ((await page.getByLabel("Generated prompt text").textContent()) ?? "").trim();
    expect(prompt.length).toBeGreaterThan(80);

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /Export as SKILL\.md/ }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("SKILL.md");
    const path = await download.path();
    const md = (await import("node:fs")).readFileSync(path, "utf8");
    expect(md).toMatch(/^---\nname: [a-z0-9]+(-[a-z0-9]+)*\ndescription: ".+"\n---\n/);
    expect(md).toContain(prompt.slice(0, 60));

    const tablist = page.getByRole("tablist", { name: "Export formats" });
    await expect(tablist.getByRole("tab")).toHaveText(["ChatGPT", "Claude", "Cursor", "ChatGPT Custom Instructions", "Claude Project Instructions", "Gemini skill", "Perplexity Project"]);
    await page.getByRole("button", { name: "Copy for ChatGPT", exact: true }).click();
    expect((await page.evaluate(() => navigator.clipboard.readText())).trim()).toBe(prompt);

    await tablist.getByRole("tab", { name: "Claude", exact: true }).click();
    await expect(tablist.getByRole("tab", { name: "Claude", exact: true })).toHaveAttribute("aria-selected", "true");
    await page.getByRole("button", { name: "Copy for Claude", exact: true }).click();
    const claude = await page.evaluate(() => navigator.clipboard.readText());
    expect(claude.startsWith("<instructions>\n")).toBe(true);
    expect(claude).toContain(prompt.slice(0, 60));

    await tablist.getByRole("tab", { name: "Cursor", exact: true }).click();
    await page.getByRole("button", { name: "Copy for Cursor", exact: true }).click();
    const cursor = await page.evaluate(() => navigator.clipboard.readText());
    expect(cursor).toMatch(/^---\ndescription: ".+"\nalwaysApply: false\n---\n/);

    await tablist.getByRole("tab", { name: "ChatGPT Custom Instructions" }).click();
    await page.getByRole("button", { name: "Copy for ChatGPT Custom Instructions" }).click();
    const ci = await page.evaluate(() => navigator.clipboard.readText());
    expect(ci).toContain("standing instructions");
    expect(ci).toContain(prompt.slice(0, 60));

    await tablist.getByRole("tab", { name: "Claude Project Instructions" }).click();
    await page.getByRole("button", { name: "Copy for Claude Project Instructions" }).click();
    const pi = await page.evaluate(() => navigator.clipboard.readText());
    expect(pi.startsWith("Project focus:")).toBe(true);
    expect(pi).toContain(prompt.slice(0, 60));

    await tablist.getByRole("tab", { name: "Gemini skill" }).click();
    await page.getByRole("button", { name: "Copy for Gemini skill" }).click();
    const gem = await page.evaluate(() => navigator.clipboard.readText());
    expect(gem.startsWith("Name:")).toBe(true);
    expect(gem).toContain("Instructions:");
    expect(gem).toContain(prompt.slice(0, 60));

    await tablist.getByRole("tab", { name: "Perplexity Project" }).click();
    await page.getByRole("button", { name: "Copy for Perplexity Project" }).click();
    const ppx = await page.evaluate(() => navigator.clipboard.readText());
    expect(ppx.startsWith("Title:")).toBe(true);
    expect(ppx).toContain("/8000 chars):");
    expect(ppx).toContain(prompt.slice(0, 60));
  });

  test("My context is saved on the device and added to the prompt", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("What do you want AI to help you with?").fill("Write 5 Instagram captions for my Diwali sale");
    await page.getByRole("button", { name: /Generate prompt/ }).click();
    const out = page.getByLabel("Generated prompt text");
    await expect(out).toBeVisible();
    await page.locator("summary", { hasText: "My context" }).click();
    await page.getByLabel("About me / my business").fill("Home bakery in Mohali");
    await page.getByLabel("My voice and tone").fill("Warm, simple Hinglish");
    await page.getByRole("button", { name: "Save my context" }).click();
    await expect(out).toContainText("My context (use it for every answer):");
    await expect(out).toContainText("Home bakery in Mohali");
    await page.reload();
    await page.getByLabel("What do you want AI to help you with?").fill("Write 5 Instagram captions for my Diwali sale");
    await page.getByRole("button", { name: /Generate prompt/ }).click();
    await expect(page.getByLabel("Generated prompt text")).toContainText("Warm, simple Hinglish");
    await page.locator("summary", { hasText: "My context" }).click();
    await page.getByRole("button", { name: "Clear" }).click();
    await expect(page.getByLabel("Generated prompt text")).not.toContainText("My context (use it");
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

test("job hunting pack renders six templates with export tabs", async ({ page }) => {
  await page.goto("/packs/job-hunting");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Job Hunting pack for India");
  await expect(page.getByTestId("pack-template")).toHaveCount(6);
  await page.getByRole("button", { name: "Preview & export" }).first().click();
  await expect(page.getByRole("tab", { name: /Claude/ }).first()).toBeVisible();
});

test("packs hub and promptperfect alternative render", async ({ page }) => {
  await page.goto("/packs");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Prompt packs");
  await expect(page.getByTestId("pack-card")).toHaveCount(5);
  await page.goto("/packs/small-business");
  await expect(page.getByTestId("pack-template")).toHaveCount(5);
  await page.goto("/packs/app-builder");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("App Builder pack for Claude Code & Cursor");
  await expect(page.getByTestId("pack-template")).toHaveCount(6);
  await page.goto("/promptperfect-alternative");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("A free PromptPerfect alternative");
  await expect(page.getByTestId("compare-table")).toBeVisible();
});

test("free items: exact pack routing, language toggle, smart mode, extension, pack OG", async ({ page, request }) => {
  await page.goto("/builder");
  await expect(page.getByTestId("lang-toggle")).toBeVisible();
  const smart = await request.post("/api/smart", { data: { input: "write blog about chai" } });
  expect(smart.status()).toBe(200);
  const j = await smart.json();
  expect(["ai", "fallback"]).toContain(j.source);
  expect(j.text.length).toBeGreaterThan(20);
  await page.goto("/extension");
  await expect(page.getByTestId("ext-download")).toBeVisible();
  const zip = await request.get("/promptpilot-extension.zip");
  expect(zip.status()).toBe(200);
  const og = await request.get("/packs/students/opengraph-image");
  expect(og.headers()["content-type"]).toContain("image/png");
  await page.goto("/enhancer");
  await expect(page.getByTestId("smart-btn")).toBeVisible();
});
