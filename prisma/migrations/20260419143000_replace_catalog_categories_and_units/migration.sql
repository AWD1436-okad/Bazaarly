CREATE TYPE "ProductCategory_new" AS ENUM (
  'PRODUCE',
  'MEAT_AND_SEAFOOD',
  'DAIRY_AND_EGGS',
  'BAKERY',
  'PANTRY',
  'SNACKS_AND_SWEETS',
  'DRINKS',
  'CLOTHING_AND_FOOTWEAR',
  'SCHOOL_STATIONERY_AND_TOYS',
  'PERSONAL_CARE_AND_HEALTH',
  'CLEANING_AND_HOUSEHOLD',
  'KITCHEN_AND_DINING',
  'BABY',
  'PET',
  'TECH_ELECTRONICS_AND_APPLIANCES'
);

ALTER TABLE "Product"
ADD COLUMN "unitLabel" TEXT NOT NULL DEFAULT 'each';

ALTER TABLE "Shop"
ALTER COLUMN "categoryFocus" TYPE "ProductCategory_new"
USING (
  CASE
    WHEN "categoryFocus" IS NULL THEN NULL
    WHEN "categoryFocus"::text = 'FOOD' THEN 'PANTRY'
    WHEN "categoryFocus"::text = 'DRINKS' THEN 'DRINKS'
    WHEN "categoryFocus"::text = 'KITCHEN' THEN 'KITCHEN_AND_DINING'
    WHEN "categoryFocus"::text = 'CLOTHES' THEN 'CLOTHING_AND_FOOTWEAR'
    WHEN "categoryFocus"::text = 'ESSENTIALS' THEN 'PERSONAL_CARE_AND_HEALTH'
    ELSE NULL
  END
)::"ProductCategory_new";

ALTER TABLE "Product"
ALTER COLUMN "category" TYPE "ProductCategory_new"
USING (
  CASE "category"::text
    WHEN 'FOOD' THEN 'PANTRY'
    WHEN 'DRINKS' THEN 'DRINKS'
    WHEN 'KITCHEN' THEN 'KITCHEN_AND_DINING'
    WHEN 'CLOTHES' THEN 'CLOTHING_AND_FOOTWEAR'
    WHEN 'ESSENTIALS' THEN 'PERSONAL_CARE_AND_HEALTH'
    ELSE 'PANTRY'
  END
)::"ProductCategory_new";

ALTER TABLE "BotCustomer"
ALTER COLUMN "preferenceCategory" TYPE "ProductCategory_new"
USING (
  CASE "preferenceCategory"::text
    WHEN 'FOOD' THEN 'PANTRY'
    WHEN 'DRINKS' THEN 'DRINKS'
    WHEN 'KITCHEN' THEN 'KITCHEN_AND_DINING'
    WHEN 'CLOTHES' THEN 'CLOTHING_AND_FOOTWEAR'
    WHEN 'ESSENTIALS' THEN 'PERSONAL_CARE_AND_HEALTH'
    ELSE 'PANTRY'
  END
)::"ProductCategory_new";

ALTER TABLE "MarketEvent"
ALTER COLUMN "category" TYPE "ProductCategory_new"
USING (
  CASE
    WHEN "category" IS NULL THEN NULL
    WHEN "category"::text = 'FOOD' THEN 'PANTRY'
    WHEN "category"::text = 'DRINKS' THEN 'DRINKS'
    WHEN "category"::text = 'KITCHEN' THEN 'KITCHEN_AND_DINING'
    WHEN "category"::text = 'CLOTHES' THEN 'CLOTHING_AND_FOOTWEAR'
    WHEN "category"::text = 'ESSENTIALS' THEN 'PERSONAL_CARE_AND_HEALTH'
    ELSE NULL
  END
)::"ProductCategory_new";

DROP TYPE "ProductCategory";

ALTER TYPE "ProductCategory_new" RENAME TO "ProductCategory";
