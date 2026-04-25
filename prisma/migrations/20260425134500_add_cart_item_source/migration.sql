CREATE TYPE "CartItemSource" AS ENUM ('MARKETPLACE', 'SUPPLIER');

ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_listingId_fkey";

DROP INDEX "CartItem_cartId_listingId_key";

ALTER TABLE "CartItem"
  ADD COLUMN "source" "CartItemSource" NOT NULL DEFAULT 'MARKETPLACE',
  ALTER COLUMN "listingId" DROP NOT NULL;

ALTER TABLE "CartItem"
  ADD CONSTRAINT "CartItem_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "Listing"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "CartItem_cartId_listingId_key" ON "CartItem"("cartId", "listingId");
CREATE UNIQUE INDEX "CartItem_cartId_productId_source_key" ON "CartItem"("cartId", "productId", "source");
