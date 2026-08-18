import { expect, test } from "@playwright/test";
import { createHash, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const e2eDatabaseUrl =
  "postgresql://addictionx_e2e:local_e2e_only@localhost:55433/migration_baseline";

test.describe("security, resilience, and responsive layout", () => {
  test("returns safe unauthenticated responses for protected upload endpoints", async ({
    request,
  }) => {
    const [avatarPost, avatarRead, adminUpload, publicMissing] =
      await Promise.all([
        request.post("/api/account/avatar"),
        request.get("/api/account/avatar/not-a-real-image"),
        request.post("/api/admin/upload-image"),
        request.get("/api/uploads/not-a-real-image"),
      ]);

    expect(avatarPost.status()).toBe(401);
    expect(avatarRead.status()).toBe(401);
    expect(adminUpload.status()).toBe(401);
    expect(publicMissing.status()).toBe(404);
  });

  test("lets a guest retrieve only their payment-receipt capability URL", async ({
    request,
  }) => {
    const prisma = new PrismaClient({
      datasources: { db: { url: e2eDatabaseUrl } },
    });
    const token = Buffer.from(randomBytes(32)).toString("base64url");
    const image = await prisma.uploadedImage.create({
      data: {
        data: Buffer.from("guest receipt"),
        mimeType: "image/png",
        isPrivate: true,
        guestAccessTokenHash: createHash("sha256").update(token).digest("hex"),
      },
    });

    try {
      const [withoutToken, wrongToken, withToken] = await Promise.all([
        request.get(`/api/uploads/${image.id}`),
        request.get(`/api/uploads/${image.id}?accessToken=wrong`),
        request.get(`/api/uploads/${image.id}?accessToken=${token}`),
      ]);

      expect(withoutToken.status()).toBe(404);
      expect(wrongToken.status()).toBe(404);
      expect(withToken.status()).toBe(200);
      expect(withToken.headers()["content-type"]).toBe("image/png");
      await expect(withToken.body()).resolves.toEqual(
        Buffer.from("guest receipt"),
      );
    } finally {
      await prisma.uploadedImage.delete({ where: { id: image.id } });
      await prisma.$disconnect();
    }
  });

  test("sets baseline browser security headers", async ({ request }) => {
    const response = await request.get("/en");
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response.headers()["x-frame-options"]).toBe("DENY");
    expect(response.headers()["referrer-policy"]).toBe(
      "strict-origin-when-cross-origin",
    );
  });

  test("has no horizontal overflow on critical public pages", async ({
    page,
  }) => {
    for (const route of [
      "/en",
      "/ar",
      "/en/catalog",
      "/en/product/red-rush",
      "/en/checkout",
      "/en/login",
    ]) {
      await page.goto(route, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      await expect(page.locator("body")).toBeVisible();
      const overflow = await page.evaluate(() => {
        const viewportWidth = window.innerWidth;
        return Array.from(document.querySelectorAll<HTMLElement>("*"))
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              tag: element.tagName.toLowerCase(),
              id: element.id,
              className: element.className,
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              width: Math.round(rect.width),
            };
          })
          .filter(
            (element) => element.left < -1 || element.right > viewportWidth + 1,
          )
          .slice(0, 12);
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
        `${route} should not horizontally overflow: ${JSON.stringify(overflow)}`,
      ).toBeTruthy();
    }
  });

  test("publishes product SEO metadata and structured data", async ({
    page,
  }) => {
    await page.goto("/en/product/red-rush");
    await expect(page).toHaveTitle(/Red Rush/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/en\/product\/red-rush$/,
    );
    await expect(
      page.locator('script[type="application/ld+json"]'),
    ).toHaveCount(1);
  });
});
