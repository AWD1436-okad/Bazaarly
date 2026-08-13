ALTER TABLE "WorldState" ADD COLUMN "supplierStockRestockedAt" TIMESTAMP(3);

UPDATE "WorldState"
SET "supplierStockRestockedAt" = "lastSimulatedAt"
WHERE "supplierStockRestockedAt" IS NULL;
