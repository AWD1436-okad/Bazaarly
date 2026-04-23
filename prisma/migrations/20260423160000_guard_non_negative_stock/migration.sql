UPDATE "Listing"
SET "quantity" = GREATEST("quantity", 0)
WHERE "quantity" < 0;

UPDATE "Inventory"
SET
  "quantity" = GREATEST("quantity", 0),
  "allocatedQuantity" = LEAST(GREATEST("allocatedQuantity", 0), GREATEST("quantity", 0))
WHERE "quantity" < 0
   OR "allocatedQuantity" < 0
   OR "allocatedQuantity" > "quantity";

ALTER TABLE "Listing"
ADD CONSTRAINT "Listing_quantity_non_negative"
CHECK ("quantity" >= 0);

ALTER TABLE "Inventory"
ADD CONSTRAINT "Inventory_quantity_non_negative"
CHECK ("quantity" >= 0);

ALTER TABLE "Inventory"
ADD CONSTRAINT "Inventory_allocated_non_negative"
CHECK ("allocatedQuantity" >= 0);

ALTER TABLE "Inventory"
ADD CONSTRAINT "Inventory_allocated_within_quantity"
CHECK ("allocatedQuantity" <= "quantity");
