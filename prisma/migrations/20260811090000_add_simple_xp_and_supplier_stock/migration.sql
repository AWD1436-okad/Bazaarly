ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "xp" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "MarketProductState" ALTER COLUMN "supplierStock" SET DEFAULT 50;
UPDATE "MarketProductState" SET "supplierStock" = LEAST("supplierStock", 50);
