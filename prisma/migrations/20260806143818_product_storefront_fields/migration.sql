-- AlterTable
ALTER TABLE "products" ADD COLUMN     "art" JSONB,
ADD COLUMN     "collection" TEXT,
ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "notes" JSONB,
ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "reviewsCount" INTEGER NOT NULL DEFAULT 0;
