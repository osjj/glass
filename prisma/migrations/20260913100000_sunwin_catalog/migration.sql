ALTER TYPE "SourceProvider" ADD VALUE IF NOT EXISTS 'SUNWIN';
ALTER TABLE "ProductImportCandidate" ADD COLUMN "sourceCategoryPaths" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
CREATE INDEX "ProductImportCandidate_sourceCategoryPaths_idx" ON "ProductImportCandidate" USING GIN ("sourceCategoryPaths");
ALTER TABLE "ProductImportCandidate" ADD COLUMN "appliedPayload" JSONB;
