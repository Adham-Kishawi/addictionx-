import { expect, test } from "@playwright/test";

test("seeded E2E administrator can authenticate and reach the dashboard", async ({
  page,
}) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;

  test.skip(!email || !password, "Administrator E2E credentials are not configured");

  await page.goto("/en/login");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email!);
  await page.getByLabel("Password", { exact: true }).fill(password!);
  await page.getByRole("button", { name: /sign in|login/i }).click();
  await expect(page).toHaveURL(/\/en\/account/);

  await page.goto("/en/admin");
  await expect(page).toHaveURL(/\/en\/admin/);
  await expect(page.getByRole("heading").first()).toBeVisible();
});
