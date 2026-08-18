import { expect, test } from "@playwright/test";

test.describe("public storefront", () => {
  test("redirects the root URL and renders both supported locales", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/en$/);
    await expect(
      page.getByRole("heading", { name: "ADDICTIONX" }),
    ).toBeVisible();

    await page.goto("/ar");
    await expect(page).toHaveURL(/\/ar$/);
    await expect(
      page.getByRole("heading", { name: "ADDICTIONX" }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("searches, filters, and opens catalog and collection pages", async ({
    page,
  }) => {
    await page.goto("/en/catalog");
    await expect(
      page.getByRole("heading", { name: "The Collection" }),
    ).toBeVisible();

    await page.goto("/en/catalog?q=Noir");
    await expect(
      page.getByRole("link", { name: "Midnight Noir" }),
    ).toBeVisible();

    await page.goto("/en/catalog?collection=gold");
    await expect(
      page.getByRole("link", { name: "Golden Hour" }).first(),
    ).toBeVisible();
    await expect(page.getByText("Clear filters")).toBeVisible();

    await page.goto("/en/collections");
    await expect(page.locator("main > h1")).toHaveText("Collections");
    const noirCollection = page
      .locator("main")
      .getByRole("link", { name: "Noir 3 perfumes" });
    await expect(noirCollection).toBeVisible();
    await noirCollection.click();
    await expect(page).toHaveURL(/\/en\/collections\/noir/);
  });

  test("adds a product to cart and reaches checkout without placing an order", async ({
    page,
  }) => {
    await page.goto("/en/product/red-rush");
    await expect(page.getByRole("heading", { name: "Red Rush" })).toBeVisible();
    await page.getByRole("button", { name: "Add to cart" }).click();
    await expect(page.getByRole("button", { name: "Added" })).toBeVisible();

    const drawer = page.getByRole("complementary");
    await expect(drawer.getByRole("heading", { name: "Cart" })).toBeVisible();
    await expect(drawer.getByText("Red Rush")).toBeVisible();
    await drawer.getByRole("button", { name: "Checkout" }).click();

    await expect(page).toHaveURL(/\/en\/checkout$/);
    await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
    await expect(page.getByText("Shipping Details")).toBeVisible();
    await expect(page.getByText("Cash on Delivery")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("validates guest auth forms locally without creating an account", async ({
    page,
  }) => {
    await page.goto("/en/login");
    await expect(
      page.getByRole("heading", { name: "Welcome Back" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(
      page.getByText("This field is required").first(),
    ).toBeVisible();

    await page.goto("/en/register");
    await expect(
      page.getByRole("heading", { name: "Create Your Account" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(
      page.getByText("Name must be at least 2 characters"),
    ).toBeVisible();
  });

  test("protects admin pages and renders a localized not-found page", async ({
    page,
  }) => {
    await page.goto("/en/admin");
    await expect(page).toHaveURL(/\/en\/login\?callbackUrl=/);

    await page.goto("/en/product/not-a-real-product");
    await expect(
      page.getByRole("heading", { name: "Page not found" }),
    ).toBeVisible();
  });

  test("serves public SEO and configuration endpoints", async ({ request }) => {
    const [robots, sitemap, shipping, checkout, payments] = await Promise.all([
      request.get("/robots.txt"),
      request.get("/sitemap.xml"),
      request.get("/api/shipping-config"),
      request.get("/api/checkout-config"),
      request.get("/api/payment-accounts"),
    ]);

    for (const response of [robots, sitemap, shipping, checkout, payments]) {
      expect(response.ok()).toBeTruthy();
    }
    await expect(robots.text()).resolves.toContain("Sitemap:");
    await expect(sitemap.text()).resolves.toContain("/en/catalog");
  });
});
