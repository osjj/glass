ALTER TABLE "Product" ADD COLUMN "copyProtectedFields" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "copyNeedsReview" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "ProductCopyRevision" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  "changedFields" TEXT[] NOT NULL,
  "reason" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductCopyRevision_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProductCopyRevision_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ProductCopyRevision_productId_createdAt_idx" ON "ProductCopyRevision"("productId", "createdAt");
