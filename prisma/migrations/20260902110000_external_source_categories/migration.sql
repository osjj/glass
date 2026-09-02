-- Keep source taxonomies independent from the Glarivo storefront category tree.
-- ExternalCategoryMapping continues to connect the two structures by provider/path.

CREATE TABLE "ExternalSourceCategory" (
    "id" TEXT NOT NULL,
    "provider" "SourceProvider" NOT NULL,
    "sourceSlug" TEXT NOT NULL,
    "sourcePath" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "parentId" TEXT,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isImportable" BOOLEAN NOT NULL DEFAULT true,
    "productCount" INTEGER,
    "pageCount" INTEGER,
    "lastSyncedAt" TIMESTAMP(3),
    "lastScannedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExternalSourceCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExternalSourceCategory_provider_sourcePath_key" ON "ExternalSourceCategory"("provider", "sourcePath");
CREATE INDEX "ExternalSourceCategory_provider_parentId_sortOrder_idx" ON "ExternalSourceCategory"("provider", "parentId", "sortOrder");
CREATE INDEX "ExternalSourceCategory_provider_isActive_isImportable_idx" ON "ExternalSourceCategory"("provider", "isActive", "isImportable");

ALTER TABLE "ExternalSourceCategory" ADD CONSTRAINT "ExternalSourceCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ExternalSourceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
