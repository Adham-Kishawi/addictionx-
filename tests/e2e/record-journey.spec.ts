import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

test.use({
  video: {
    mode: "on",
    size: { width: 1366, height: 768 }
  },
  viewport: { width: 1366, height: 768 }
});

test("E2E full journey with video recording", async ({ page }) => {
  const baseUrl = "https://addictionx.store";

  // Step 1: Arabic Home
  await page.goto(`${baseUrl}/ar`, { waitUntil: "networkidle" });
  await expect(page).toHaveTitle(/ADDICTIONX/i);
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(1000);
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(1000);

  // Step 2: English Home
  await page.goto(`${baseUrl}/en`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(1000);

  // Step 3: Catalog
  await page.goto(`${baseUrl}/ar/catalog`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.mouse.wheel(0, 500);

  // Step 4: Product
  await page.goto(`${baseUrl}/ar/product/euphoria`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(1000);

  // Step 5: Checkout
  await page.goto(`${baseUrl}/ar/checkout`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(1000);
});

test.afterEach(async ({ page }) => {
  const video = page.video();
  if (video) {
    const videoPath = await video.path();
    const videoDir = path.resolve(process.cwd(), "test-videos");
    if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });
    const dest = path.join(videoDir, `playwright-test-${Date.now()}.webm`);
    try {
      fs.copyFileSync(videoPath, dest);
    } catch {}
  }
});
