CREATE TABLE "CaseStudy" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "coverImage" TEXT,
    "coverImageAlt" TEXT,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CaseStudy_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CaseStudy_slug_key" ON "CaseStudy"("slug");
CREATE INDEX "CaseStudy_status_publishedAt_idx" ON "CaseStudy"("status", "publishedAt");
