ALTER TABLE "User" ADD COLUMN "bankNumberEncrypted" TEXT;
ALTER TABLE "User" ADD COLUMN "bankNumberLast4" TEXT;
ALTER TABLE "User" ADD COLUMN "currencyCode" TEXT NOT NULL DEFAULT 'AUD';

-- Money is now stored internally in AUD. Bring supplier state and listings back to AUD
-- if an older global region profile had re-priced stored values.
UPDATE "MarketProductState" AS state
SET
  "currentSupplierPrice" = profile."supplierPrice",
  "marketAveragePrice" = profile."marketAveragePrice"
FROM "ProductPriceProfile" AS profile
WHERE profile."productId" = state."productId"
  AND profile."currencyCode" = 'AUD';

UPDATE "Listing" AS listing
SET
  "price" = GREATEST(
    1,
    COALESCE(
      ROUND((listing."price"::numeric / NULLIF(old_profile."marketAveragePrice", 0)) * aud_profile."marketAveragePrice"),
      listing."price"
    )
  )::integer,
  "currencyCode" = 'AUD'
FROM "WorldState" AS world_state,
  "ProductPriceProfile" AS old_profile,
  "ProductPriceProfile" AS aud_profile
WHERE world_state."id" = 'global'
  AND old_profile."productId" = listing."productId"
  AND aud_profile."productId" = listing."productId"
  AND old_profile."currencyCode" = world_state."currencyCode"
  AND aud_profile."currencyCode" = 'AUD';

UPDATE "WorldState"
SET "currencyCode" = 'AUD'
WHERE "id" = 'global';
