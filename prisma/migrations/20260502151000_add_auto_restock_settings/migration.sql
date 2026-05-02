-- Add user-level auto restock settings and listing-level cooldown tracking
ALTER TABLE "User"
ADD COLUMN "autoRestockEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "autoRestockQuantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "autoRestockLastRunAt" TIMESTAMP(3);

ALTER TABLE "Listing"
ADD COLUMN "lastAutoRestockedAt" TIMESTAMP(3);
