import { defineConfig, devices } from "@playwright/test";

const port = 3100;
// Next's development server validates browser asset requests against its
// configured local origin. Keep browser E2E traffic on localhost so client
// chunks and NextAuth behave exactly as they do in a real local browser.
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "/private/tmp/addictionx-playwright-results",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ["list"],
    [
      "html",
      {
        open: "never",
        outputFolder: "/private/tmp/addictionx-playwright-report",
      },
    ],
  ],
  use: {
    baseURL,
    channel: "chrome",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `AUTH_TRUST_HOST=true DATABASE_URL=postgresql://addictionx_e2e:local_e2e_only@localhost:55433/migration_baseline npx prisma migrate deploy && npm run build && npm run start -- --port ${port}`,
    url: `${baseURL}/en`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "tablet-chrome",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 768, height: 1024 },
      },
    },
    { name: "mobile-chrome", use: { ...devices["Pixel 5"] } },
  ],
});
