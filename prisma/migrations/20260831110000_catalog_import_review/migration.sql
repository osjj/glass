-- Catalog structure and review workflow for staged external product imports.
-- This migration preserves the legacy Product.category and Product.sku columns
-- while adding normalized relations so the rollout can remain backward-compatible.

-- CreateEnum
CREATE TYPE "PricingMode" AS ENUM ('REQUEST_QUOTE', 'FIXED', 'TIERED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('UNREVIEWED', 'VERIFIED', 'CONFLICT', 'REJECTED');

-- CreateEnum
CREATE TYPE "ImportCandidateStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'IMPORTED', 'REJECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "SourceProvider" AS ENUM ('GARBO', 'MANUAL');

-- CreateEnum
CREATE TYPE "MediaRole" AS ENUM ('GALLERY', 'DETAIL', 'SIZE_GUIDE', 'PRODUCTION', 'PACKAGING', 'OEM_ODM', 'VIDEO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "MediaRightsStatus" AS ENUM ('UNREVIEWED', 'AUTHORIZED', 'REPLACE_REQUIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SpecificationGroup" AS ENUM ('GENERAL', 'DIMENSION', 'MATERIAL', 'PACKAGING', 'COMMERCIAL', 'COMPOSITION');

-- CreateEnum
CREATE TYPE "CertificationStatus" AS ENUM ('UNVERIFIED', 'VERIFIED', 'REJECTED');

-- DropIndex
DROP INDEX "ProductImage_productId_sortOrder_idx";

-- AlterTable
ALTER TABLE "Product"
ADD COLUMN "pricingMode" "PricingMode" NOT NULL DEFAULT 'REQUEST_QUOTE',
ADD COLUMN "seoDescription" TEXT,
ADD COLUMN "seoTitle" TEXT,
ALTER COLUMN "price" DROP NOT NULL,
ALTER COLUMN "price" DROP DEFAULT,
ALTER COLUMN "moq" DROP NOT NULL,
ALTER COLUMN "moq" DROP DEFAULT,
ALTER COLUMN "unit" DROP NOT NULL,
ALTER COLUMN "unit" DROP DEFAULT;

-- Preserve the commercial mode of existing products with a configured price.
UPDATE "Product"
SET "pricingMode" = 'FIXED'
WHERE "price" IS NOT NULL AND "price" > 0;

-- AlterTable
ALTER TABLE "ProductAttribute"
ADD COLUMN "key" TEXT,
ADD COLUMN "normalizedValue" TEXT,
ADD COLUMN "rawValue" TEXT,
ADD COLUMN "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'VERIFIED';

-- AlterTable
ALTER TABLE "ProductImage"
ADD COLUMN "height" INTEGER,
ADD COLUMN "mimeType" TEXT,
ADD COLUMN "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'VERIFIED',
ADD COLUMN "rightsStatus" "MediaRightsStatus" NOT NULL DEFAULT 'UNREVIEWED',
ADD COLUMN "role" "MediaRole" NOT NULL DEFAULT 'GALLERY',
ADD COLUMN "sectionKey" TEXT,
ADD COLUMN "sha256" TEXT,
ADD COLUMN "sourceUrl" TEXT,
ADD COLUMN "storageKey" TEXT,
ADD COLUMN "width" INTEGER;

-- Existing images were uploaded through the internal product workflow.
UPDATE "ProductImage" SET "rightsStatus" = 'AUTHORIZED';

-- AlterTable
ALTER TABLE "ProductSpecification"
ADD COLUMN "componentId" TEXT,
ADD COLUMN "group" "SpecificationGroup" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN "key" TEXT,
ADD COLUMN "numericValue" DECIMAL(14,4),
ADD COLUMN "rawValue" TEXT,
ADD COLUMN "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'VERIFIED',
ADD COLUMN "unit" TEXT,
ADD COLUMN "variantId" TEXT;

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalCategoryMapping" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "provider" "SourceProvider" NOT NULL,
    "sourceSlug" TEXT NOT NULL,
    "sourcePath" TEXT NOT NULL,
    "sourceName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExternalCategoryMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCategory" (
    "productId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("productId", "categoryId")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT,
    "label" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "price" DECIMAL(12,2),
    "moq" INTEGER,
    "unit" TEXT,
    "stock" INTEGER,
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'VERIFIED',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductComponent" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProductComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCertificationClaim" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "claimName" TEXT NOT NULL,
    "sourceText" TEXT,
    "sourceUrl" TEXT,
    "evidenceFileUrl" TEXT,
    "status" "CertificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verifiedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductCertificationClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImportCandidate" (
    "id" TEXT NOT NULL,
    "provider" "SourceProvider" NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceCategorySlug" TEXT NOT NULL,
    "sourceCategoryPath" TEXT NOT NULL,
    "sourceTitle" TEXT NOT NULL,
    "sourceSku" TEXT,
    "rawPayload" JSONB NOT NULL,
    "normalizedPayload" JSONB,
    "warnings" JSONB,
    "sourceHash" TEXT NOT NULL,
    "conflictCount" INTEGER NOT NULL DEFAULT 0,
    "warningCount" INTEGER NOT NULL DEFAULT 0,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "sourceLastModifiedAt" TIMESTAMP(3),
    "status" "ImportCandidateStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewerId" TEXT,
    "productId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductImportCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImportField" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "rawValue" TEXT NOT NULL,
    "normalizedValue" TEXT,
    "unit" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'UNREVIEWED',
    "note" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductImportField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE INDEX "Category_parentId_sortOrder_idx" ON "Category"("parentId", "sortOrder");
CREATE INDEX "Category_isActive_sortOrder_idx" ON "Category"("isActive", "sortOrder");
CREATE INDEX "ExternalCategoryMapping_categoryId_idx" ON "ExternalCategoryMapping"("categoryId");
CREATE INDEX "ExternalCategoryMapping_provider_sourceSlug_idx" ON "ExternalCategoryMapping"("provider", "sourceSlug");
CREATE UNIQUE INDEX "ExternalCategoryMapping_provider_sourcePath_key" ON "ExternalCategoryMapping"("provider", "sourcePath");
CREATE INDEX "ProductCategory_categoryId_sortOrder_idx" ON "ProductCategory"("categoryId", "sortOrder");
CREATE INDEX "ProductCategory_productId_isPrimary_idx" ON "ProductCategory"("productId", "isPrimary");
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");
CREATE INDEX "ProductVariant_productId_sortOrder_idx" ON "ProductVariant"("productId", "sortOrder");
CREATE INDEX "ProductVariant_productId_isDefault_idx" ON "ProductVariant"("productId", "isDefault");
CREATE INDEX "ProductComponent_productId_sortOrder_idx" ON "ProductComponent"("productId", "sortOrder");
CREATE INDEX "ProductComponent_variantId_idx" ON "ProductComponent"("variantId");
CREATE INDEX "ProductCertificationClaim_productId_sortOrder_idx" ON "ProductCertificationClaim"("productId", "sortOrder");
CREATE INDEX "ProductCertificationClaim_status_idx" ON "ProductCertificationClaim"("status");
CREATE INDEX "ProductImportCandidate_provider_sourceCategorySlug_status_idx" ON "ProductImportCandidate"("provider", "sourceCategorySlug", "status");
CREATE INDEX "ProductImportCandidate_status_updatedAt_idx" ON "ProductImportCandidate"("status", "updatedAt");
CREATE INDEX "ProductImportCandidate_productId_idx" ON "ProductImportCandidate"("productId");
CREATE UNIQUE INDEX "ProductImportCandidate_provider_sourceUrl_key" ON "ProductImportCandidate"("provider", "sourceUrl");
CREATE INDEX "ProductImportField_candidateId_sortOrder_idx" ON "ProductImportField"("candidateId", "sortOrder");
CREATE INDEX "ProductImportField_status_idx" ON "ProductImportField"("status");
CREATE UNIQUE INDEX "ProductImportField_candidateId_fieldKey_key" ON "ProductImportField"("candidateId", "fieldKey");
CREATE INDEX "ProductImage_productId_role_sortOrder_idx" ON "ProductImage"("productId", "role", "sortOrder");
CREATE INDEX "ProductImage_sha256_idx" ON "ProductImage"("sha256");
CREATE INDEX "ProductSpecification_variantId_sortOrder_idx" ON "ProductSpecification"("variantId", "sortOrder");
CREATE INDEX "ProductSpecification_componentId_sortOrder_idx" ON "ProductSpecification"("componentId", "sortOrder");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExternalCategoryMapping" ADD CONSTRAINT "ExternalCategoryMapping_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductComponent" ADD CONSTRAINT "ProductComponent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductComponent" ADD CONSTRAINT "ProductComponent_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductSpecification" ADD CONSTRAINT "ProductSpecification_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductSpecification" ADD CONSTRAINT "ProductSpecification_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "ProductComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductCertificationClaim" ADD CONSTRAINT "ProductCertificationClaim_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductImportCandidate" ADD CONSTRAINT "ProductImportCandidate_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductImportCandidate" ADD CONSTRAINT "ProductImportCandidate_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductImportField" ADD CONSTRAINT "ProductImportField_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "ProductImportCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed the current internal catalog roots and the first Garbo test mapping.
INSERT INTO "Category" ("id", "name", "slug", "sortOrder", "isActive", "updatedAt") VALUES
  ('cat_drinkware', 'Drinkware', 'drinkware', 10, true, CURRENT_TIMESTAMP),
  ('cat_tableware', 'Tableware', 'tableware', 20, true, CURRENT_TIMESTAMP),
  ('cat_serveware', 'Serveware', 'serveware', 30, true, CURRENT_TIMESTAMP),
  ('cat_storage', 'Storage', 'storage', 40, true, CURRENT_TIMESTAMP),
  ('cat_bakeware', 'Bakeware', 'bakeware', 50, true, CURRENT_TIMESTAMP),
  ('cat_colored_glassware', 'Colored Glassware', 'colored-glassware', 60, true, CURRENT_TIMESTAMP),
  ('cat_shot_glass', 'Shot Glass', 'shot-glass', 10, true, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

UPDATE "Category"
SET "parentId" = (SELECT "id" FROM "Category" WHERE "slug" = 'drinkware')
WHERE "slug" = 'shot-glass';

INSERT INTO "ExternalCategoryMapping" (
  "id", "categoryId", "provider", "sourceSlug", "sourcePath", "sourceName", "updatedAt"
)
SELECT
  'ecm_garbo_shot_glass', "id", 'GARBO', 'shot-glass', '/shot-glass/', 'Shot Glass', CURRENT_TIMESTAMP
FROM "Category"
WHERE "slug" = 'shot-glass'
ON CONFLICT ("provider", "sourcePath") DO NOTHING;

-- Preserve any legacy categories that are not part of the predefined roots.
INSERT INTO "Category" ("id", "name", "slug", "sortOrder", "isActive", "updatedAt")
SELECT
  'cat_legacy_' || md5(p."category"),
  initcap(replace(p."category", '-', ' ')),
  p."category",
  900,
  true,
  CURRENT_TIMESTAMP
FROM "Product" p
WHERE p."category" <> ''
GROUP BY p."category"
ON CONFLICT ("slug") DO NOTHING;

-- Link every existing product to one primary normalized category.
INSERT INTO "ProductCategory" ("productId", "categoryId", "isPrimary", "sortOrder")
SELECT p."id", c."id", true, 0
FROM "Product" p
JOIN "Category" c ON c."slug" = p."category"
ON CONFLICT ("productId", "categoryId") DO NOTHING;

-- Backfill a default variant so existing Product.sku values remain represented.
INSERT INTO "ProductVariant" (
  "id", "productId", "sku", "label", "isDefault", "price", "moq", "unit", "stock", "sortOrder", "updatedAt"
)
SELECT
  'pv_migrated_' || md5(p."id"),
  p."id",
  p."sku",
  COALESCE(p."sku", 'Default'),
  true,
  p."price",
  p."moq",
  p."unit",
  p."stock",
  0,
  CURRENT_TIMESTAMP
FROM "Product" p;
