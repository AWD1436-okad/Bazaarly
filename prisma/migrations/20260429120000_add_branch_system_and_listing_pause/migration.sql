CREATE TYPE "BranchRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

ALTER TABLE "Shop"
ADD COLUMN "availableToBranch" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "branchLocation" TEXT,
ADD COLUMN "parentShopId" TEXT;

ALTER TABLE "Listing"
ADD COLUMN "isPaused" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "BranchRequest" (
  "id" TEXT NOT NULL,
  "requesterId" TEXT NOT NULL,
  "parentShopId" TEXT NOT NULL,
  "requesterShopId" TEXT,
  "status" "BranchRequestStatus" NOT NULL DEFAULT 'PENDING',
  "message" TEXT,
  "requestedLocation" TEXT,
  "approvedLocation" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "decidedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BranchRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BranchRequest_requesterId_status_idx" ON "BranchRequest"("requesterId", "status");
CREATE INDEX "BranchRequest_parentShopId_status_idx" ON "BranchRequest"("parentShopId", "status");
CREATE INDEX "BranchRequest_expiresAt_idx" ON "BranchRequest"("expiresAt");

ALTER TABLE "Shop"
ADD CONSTRAINT "Shop_parentShopId_fkey"
FOREIGN KEY ("parentShopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BranchRequest"
ADD CONSTRAINT "BranchRequest_requesterId_fkey"
FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BranchRequest"
ADD CONSTRAINT "BranchRequest_parentShopId_fkey"
FOREIGN KEY ("parentShopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BranchRequest"
ADD CONSTRAINT "BranchRequest_requesterShopId_fkey"
FOREIGN KEY ("requesterShopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
