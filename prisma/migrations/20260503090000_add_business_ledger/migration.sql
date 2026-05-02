CREATE TYPE "BusinessLedgerEntryType" AS ENUM ('EXPENSE');

CREATE TYPE "BusinessLedgerEntryCategory" AS ENUM (
  'STOCK_PURCHASE',
  'AUTO_RESTOCK_PURCHASE',
  'SUBSCRIPTION_FEE',
  'FEATURE_FEE',
  'OTHER_EXPENSE'
);

CREATE TABLE "BusinessLedgerEntry" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "BusinessLedgerEntryType" NOT NULL,
  "category" "BusinessLedgerEntryCategory" NOT NULL,
  "amount" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "data" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BusinessLedgerEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BusinessLedgerEntry_userId_createdAt_idx" ON "BusinessLedgerEntry"("userId", "createdAt");
CREATE INDEX "BusinessLedgerEntry_userId_type_createdAt_idx" ON "BusinessLedgerEntry"("userId", "type", "createdAt");
CREATE INDEX "BusinessLedgerEntry_userId_category_createdAt_idx" ON "BusinessLedgerEntry"("userId", "category", "createdAt");

ALTER TABLE "BusinessLedgerEntry"
ADD CONSTRAINT "BusinessLedgerEntry_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
