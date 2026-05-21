ALTER TABLE "OrderLineItem"
ADD COLUMN "costUnitPrice" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lineProfit" INTEGER NOT NULL DEFAULT 0;

-- Historical line items did not store the seller's cost basis at sale time.
-- Backfill safely from Product.basePrice, which is the best durable fallback
-- available for old rows and does not touch balances, orders, or inventory.
UPDATE "OrderLineItem" oli
SET
  "costUnitPrice" = COALESCE(NULLIF(p."basePrice", 0), 0),
  "lineProfit" = (oli."unitPrice" - COALESCE(NULLIF(p."basePrice", 0), 0)) * oli."quantity"
FROM "Product" p
WHERE p."id" = oli."productId";
