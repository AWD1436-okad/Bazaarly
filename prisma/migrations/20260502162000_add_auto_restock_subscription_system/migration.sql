CREATE TYPE "AutoRestockPlan" AS ENUM ('SIMPLE', 'PRO', 'MAX');
CREATE TYPE "AutoRestockSubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED');
CREATE TYPE "AutoRestockRequestStatus" AS ENUM ('PENDING', 'SKIPPED', 'APPROVED', 'COMPLETED', 'FAILED');

CREATE TABLE "AutoRestockSubscription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "plan" "AutoRestockPlan" NOT NULL,
  "status" "AutoRestockSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "dailyCostCents" INTEGER NOT NULL,
  "setupFeeCents" INTEGER NOT NULL DEFAULT 0,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "nextChargeAt" TIMESTAMP(3) NOT NULL,
  "lastChargedAt" TIMESTAMP(3),
  "lastRestockAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AutoRestockSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AutoRestockSubscription_userId_key" ON "AutoRestockSubscription"("userId");
CREATE INDEX "AutoRestockSubscription_status_nextChargeAt_idx" ON "AutoRestockSubscription"("status", "nextChargeAt");

CREATE TABLE "AutoRestockRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "plan" "AutoRestockPlan" NOT NULL,
  "status" "AutoRestockRequestStatus" NOT NULL DEFAULT 'PENDING',
  "estimatedCostCents" INTEGER NOT NULL,
  "itemCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "decidedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "failureReason" TEXT,
  CONSTRAINT "AutoRestockRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AutoRestockRequest_userId_status_createdAt_idx" ON "AutoRestockRequest"("userId", "status", "createdAt");

CREATE TABLE "AutoRestockRequestItem" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPrice" INTEGER NOT NULL,
  "lineTotal" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AutoRestockRequestItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AutoRestockRequestItem_requestId_listingId_key" ON "AutoRestockRequestItem"("requestId", "listingId");
CREATE INDEX "AutoRestockRequestItem_listingId_idx" ON "AutoRestockRequestItem"("listingId");

ALTER TABLE "AutoRestockSubscription"
  ADD CONSTRAINT "AutoRestockSubscription_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AutoRestockRequest"
  ADD CONSTRAINT "AutoRestockRequest_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AutoRestockRequestItem"
  ADD CONSTRAINT "AutoRestockRequestItem_requestId_fkey"
  FOREIGN KEY ("requestId") REFERENCES "AutoRestockRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AutoRestockRequestItem"
  ADD CONSTRAINT "AutoRestockRequestItem_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AutoRestockRequestItem"
  ADD CONSTRAINT "AutoRestockRequestItem_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
