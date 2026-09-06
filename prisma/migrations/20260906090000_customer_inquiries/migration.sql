CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'CLOSED', 'SPAM');

CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "submissionId" UUID NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "countryCode" VARCHAR(5) NOT NULL DEFAULT '',
    "phone" VARCHAR(100) NOT NULL DEFAULT '',
    "name" VARCHAR(100) NOT NULL,
    "companyName" VARCHAR(200) NOT NULL DEFAULT '',
    "message" VARCHAR(1000) NOT NULL,
    "sourcePath" VARCHAR(500) NOT NULL,
    "productName" VARCHAR(500),
    "productSku" VARCHAR(200),
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "notes" VARCHAR(5000) NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Inquiry_submissionId_key" ON "Inquiry"("submissionId");
CREATE INDEX "Inquiry_status_createdAt_idx" ON "Inquiry"("status", "createdAt");
CREATE INDEX "Inquiry_email_createdAt_idx" ON "Inquiry"("email", "createdAt");
CREATE INDEX "Inquiry_createdAt_idx" ON "Inquiry"("createdAt");
