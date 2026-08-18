import { expect, test } from "@playwright/test";

type LabMetrics = {
  domContentLoaded: number;
  load: number;
  ttfb: number;
  firstContentfulPaint: number | null;
  largestContentfulPaint: number | null;
  cumulativeLayoutShift: number;
  longTaskCount: number;
  longTaskDuration: number;
  initialRequests: number;
  transferredBytes: number;
  javascriptBytes: number;
  cssBytes: number;
  imageBytes: number;
  videoRequests: number;
  videoResources: string[];
};

test.describe("production performance smoke", () => {
  test("keeps the homepage initial load within lab budgets", async ({
    page,
    browserName,
  }, testInfo) => {
    test.skip(
      browserName !== "chromium",
      "The lab metric observers used here are Chromium-specific.",
    );
    await page.addInitScript(() => {
      const metrics = {
        lcp: 0,
        cls: 0,
        longTasks: [] as number[],
      };
      (window as Window & { __e2eLabMetrics?: typeof metrics }).__e2eLabMetrics =
        metrics;

      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) metrics.lcp = entry.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as PerformanceEntryList) {
          const layoutShift = entry as PerformanceEntry & {
            hadRecentInput?: boolean;
            value?: number;
          };
          if (!layoutShift.hadRecentInput) metrics.cls += layoutShift.value ?? 0;
        }
      }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) metrics.longTasks.push(entry.duration);
      }).observe({ type: "longtask", buffered: true });
    });

    await page.goto("/en", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: "ADDICTIONX" })).toBeVisible();
    await page.waitForTimeout(500);

    const metrics = await page.evaluate((): LabMetrics => {
      const navigation = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      const resources = performance.getEntriesByType(
        "resource",
      ) as PerformanceResourceTiming[];
      const observed = (window as Window & {
        __e2eLabMetrics?: {
          lcp: number;
          cls: number;
          longTasks: number[];
        };
      }).__e2eLabMetrics;
      const byteSum = (predicate: (resource: PerformanceResourceTiming) => boolean) =>
        resources
          .filter(predicate)
          .reduce((sum, resource) => sum + resource.transferSize, 0);

      return {
        ttfb: navigation.responseStart - navigation.requestStart,
        domContentLoaded:
          navigation.domContentLoadedEventEnd - navigation.startTime,
        load: navigation.loadEventEnd - navigation.startTime,
        firstContentfulPaint:
          performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? null,
        largestContentfulPaint: observed?.lcp || null,
        cumulativeLayoutShift: observed?.cls ?? 0,
        longTaskCount: observed?.longTasks.length ?? 0,
        longTaskDuration: (observed?.longTasks ?? []).reduce(
          (sum, duration) => sum + duration,
          0,
        ),
        initialRequests: resources.length,
        transferredBytes: byteSum(() => true),
        javascriptBytes: byteSum((resource) => resource.initiatorType === "script"),
        cssBytes: byteSum((resource) => resource.initiatorType === "link"),
        imageBytes: byteSum((resource) => resource.initiatorType === "img"),
        videoRequests: resources.filter((resource) => resource.initiatorType === "video")
          .length,
        videoResources: resources
          .filter((resource) => resource.initiatorType === "video")
          .map((resource) => new URL(resource.name).pathname),
      };
    });

    await testInfo.attach("homepage-lab-metrics.json", {
      body: JSON.stringify(metrics, null, 2),
      contentType: "application/json",
    });
    console.info(`homepage lab metrics: ${JSON.stringify(metrics)}`);

    expect(metrics.domContentLoaded).toBeLessThan(4_000);
    expect(metrics.cumulativeLayoutShift).toBeLessThan(0.1);
    expect(metrics.videoResources).not.toContain("/uploads/explode/assembly-scrub.mp4");
    // This is a raw long-task sum, not Lighthouse's TBT calculation. Keep a
    // stable ceiling here while Lighthouse-equivalent metrics stay reported
    // as lab observations rather than field data.
    expect(metrics.longTaskDuration).toBeLessThan(2_500);
  });
});
