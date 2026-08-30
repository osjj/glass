-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN');

-- AlterTable
ALTER TABLE "AdminUser"
ADD COLUMN "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lockedUntil" TIMESTAMP(3),
ADD COLUMN "lastLoginAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "AdminUser_role_isActive_idx" ON "AdminUser"("role", "isActive");
