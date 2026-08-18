import { expect, test } from "@playwright/test";

test.describe("homepage", () => {
  test("renders the hero, supports collection selection, and routes to the filtered catalog", async ({
    page,
  }) => {
    await page.goto("/en");
    await expect(
      page.getByRole("heading", { name: "ADDICTIONX" }),
    ).toBeVisible();
    await expect(
      page.getByText("What kind of experience do you love?"),
    ).toBeVisible();
    const noir = page
      .locator("#hero-stage")
      .getByRole("button", { name: "Noir" });
    await noir.click();
    await expect(noir).toHaveAttribute("aria-pressed", "true");
    const go = page.getByRole("link", { name: "Let's Go" });
    await expect(go).toHaveAttribute("href", "/en/catalog?collection=noir");
    await go.click();
    await expect(page).toHaveURL(/\/en\/catalog\?collection=noir/);
  });

  test("plays the entrance animation and responds to hero pointer movement", async ({
    page,
  }) => {
    await page.goto("/en");
    const title = page.getByRole("heading", { name: "ADDICTIONX" });
    await expect(title).toBeVisible();
    await expect(title.locator("span")).toHaveCount(10);
    await page.waitForTimeout(1_500);
    await expect(title.locator("span").first()).toHaveCSS("opacity", "1");
    const before = await page
      .locator("#hero-stage video")
      .evaluateAll((videos) =>
        videos.map((video) => (video as HTMLVideoElement).currentTime),
      );
    await page.mouse.move(1000, 360);
    await page.waitForTimeout(350);
    const after = await page
      .locator("#hero-stage video")
      .evaluateAll((videos) =>
        videos.map((video) => (video as HTMLVideoElement).currentTime),
      );
    expect(after.some((time, index) => time !== before[index])).toBeTruthy();
  });

  test("keeps initial animation work light and defers the showcase video", async ({
    page,
  }) => {
    await page.goto("/en");
    await expect(
      page.getByRole("heading", { name: "ADDICTIONX" }),
    ).toBeVisible();
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      const resources = performance.getEntriesByType(
        "resource",
      ) as PerformanceResourceTiming[];
      return {
        domContentLoaded:
          navigation.domContentLoadedEventEnd - navigation.startTime,
        hasAssemblyRequest: resources.some((resource) =>
          resource.name.includes("assembly-scrub.mp4"),
        ),
      };
    });
    expect(metrics.domContentLoaded).toBeLessThan(4_000);
    expect(metrics.hasAssemblyRequest).toBeFalsy();
  });

  test("honors reduced-motion preferences", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/en");
    await expect(
      page.getByRole("heading", { name: "ADDICTIONX" }),
    ).toBeVisible();
    await expect(page.locator(".animate-blink")).toHaveCount(0);
    await expect(page.locator("#hero-stage video")).toHaveCount(2);
    await expect
      .poll(() =>
        page
          .locator("#hero-stage video")
          .first()
          .evaluate((video) => (video as HTMLVideoElement).paused),
      )
      .toBeTruthy();
  });
});
