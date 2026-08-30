-- AlterTable
ALTER TABLE "BlogPost"
ADD COLUMN "category" TEXT NOT NULL DEFAULT 'Glassware insights',
ADD COLUMN "readTimeMinutes" INTEGER NOT NULL DEFAULT 5;
