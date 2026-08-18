-- Guest orders have no authenticated image owner. Store only a SHA-256 digest
-- of their random receipt capability; the original token is never persisted.
ALTER TABLE "uploaded_images"
ADD COLUMN "guestAccessTokenHash" TEXT;

CREATE UNIQUE INDEX "uploaded_images_guestAccessTokenHash_key"
ON "uploaded_images"("guestAccessTokenHash");
