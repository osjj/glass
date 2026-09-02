-- Add a Garbo-aligned, ordered product-detail structure without changing
-- category ownership. Existing products continue to render through fallbacks
-- until they are saved in the new editor.

-- CreateEnum
CREATE TYPE "ProductPageTemplate" AS ENUM ('GARBO_DETAIL');

-- AlterTable
ALTER TABLE "Product"
ADD COLUMN "pageTemplate" "ProductPageTemplate" NOT NULL DEFAULT 'GARBO_DETAIL',
ADD COLUMN "sourceProvider" "SourceProvider",
ADD COLUMN "sourceUrl" TEXT,
ADD COLUMN "sourceCategoryPath" TEXT,
ADD COLUMN "detailsHeading" TEXT NOT NULL DEFAULT 'Details',
ADD COLUMN "specificationHeading" TEXT NOT NULL DEFAULT 'Specifications';

-- AlterTable
ALTER TABLE "ProductImage"
ADD COLUMN "contentSectionId" TEXT;

-- CreateTable
CREATE TABLE "ProductOverviewField" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "key" TEXT,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "rawValue" TEXT,
    "normalizedValue" TEXT,
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'VERIFIED',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProductOverviewField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductContentSection" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductContentSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_sourceProvider_sourceCategoryPath_idx" ON "Product"("sourceProvider", "sourceCategoryPath");
CREATE INDEX "ProductOverviewField_productId_sortOrder_idx" ON "ProductOverviewField"("productId", "sortOrder");
CREATE INDEX "ProductContentSection_productId_sortOrder_idx" ON "ProductContentSection"("productId", "sortOrder");
CREATE UNIQUE INDEX "ProductContentSection_productId_sourceKey_key" ON "ProductContentSection"("productId", "sourceKey");
CREATE INDEX "ProductImage_contentSectionId_sortOrder_idx" ON "ProductImage"("contentSectionId", "sortOrder");

-- AddForeignKey
ALTER TABLE "ProductOverviewField" ADD CONSTRAINT "ProductOverviewField_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductContentSection" ADD CONSTRAINT "ProductContentSection_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_contentSectionId_fkey" FOREIGN KEY ("contentSectionId") REFERENCES "ProductContentSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
