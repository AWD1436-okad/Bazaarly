ALTER TABLE "WorldState" ADD COLUMN "currencyCode" TEXT NOT NULL DEFAULT 'AUD';
ALTER TABLE "Listing" ADD COLUMN "currencyCode" TEXT NOT NULL DEFAULT 'AUD';

CREATE TABLE "ProductPriceProfile" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "currencyCode" TEXT NOT NULL,
  "unitLabel" TEXT NOT NULL,
  "basePrice" INTEGER NOT NULL,
  "supplierPrice" INTEGER NOT NULL,
  "marketAveragePrice" INTEGER NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProductPriceProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductPriceProfile_productId_currencyCode_key"
  ON "ProductPriceProfile"("productId", "currencyCode");

CREATE INDEX "ProductPriceProfile_currencyCode_idx"
  ON "ProductPriceProfile"("currencyCode");

ALTER TABLE "ProductPriceProfile"
  ADD CONSTRAINT "ProductPriceProfile_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
