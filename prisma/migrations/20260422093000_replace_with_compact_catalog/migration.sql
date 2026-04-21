CREATE TYPE "ProductCategory_new" AS ENUM (
  'FRUIT_AND_VEGETABLES',
  'BAKERY_AND_GRAINS',
  'PANTRY_AND_COOKING',
  'DRINKS',
  'MEAT_DAIRY_AND_PROTEIN',
  'SNACKS_AND_SWEETS',
  'KITCHEN_AND_COOKWARE',
  'CLEANING_AND_PERSONAL_CARE',
  'CLOTHING',
  'HOME_AND_STORAGE',
  'ELECTRONICS',
  'SCHOOL_AND_MISC'
);

ALTER TABLE "Shop"
ALTER COLUMN "categoryFocus" TYPE "ProductCategory_new"
USING (
  CASE
    WHEN "categoryFocus" IS NULL THEN NULL
    WHEN "categoryFocus"::text = 'PRODUCE' THEN 'FRUIT_AND_VEGETABLES'::"ProductCategory_new"
    WHEN "categoryFocus"::text = 'BAKERY' THEN 'BAKERY_AND_GRAINS'::"ProductCategory_new"
    WHEN "categoryFocus"::text = 'PANTRY' THEN 'PANTRY_AND_COOKING'::"ProductCategory_new"
    WHEN "categoryFocus"::text = 'DRINKS' THEN 'DRINKS'::"ProductCategory_new"
    WHEN "categoryFocus"::text IN ('MEAT_AND_SEAFOOD', 'DAIRY_AND_EGGS')
      THEN 'MEAT_DAIRY_AND_PROTEIN'::"ProductCategory_new"
    WHEN "categoryFocus"::text = 'SNACKS_AND_SWEETS' THEN 'SNACKS_AND_SWEETS'::"ProductCategory_new"
    WHEN "categoryFocus"::text = 'KITCHEN_AND_DINING' THEN 'KITCHEN_AND_COOKWARE'::"ProductCategory_new"
    WHEN "categoryFocus"::text IN ('PERSONAL_CARE_AND_HEALTH', 'CLEANING_AND_HOUSEHOLD')
      THEN 'CLEANING_AND_PERSONAL_CARE'::"ProductCategory_new"
    WHEN "categoryFocus"::text = 'CLOTHING_AND_FOOTWEAR' THEN 'CLOTHING'::"ProductCategory_new"
    WHEN "categoryFocus"::text = 'BABY' THEN 'HOME_AND_STORAGE'::"ProductCategory_new"
    WHEN "categoryFocus"::text = 'PET' THEN 'HOME_AND_STORAGE'::"ProductCategory_new"
    WHEN "categoryFocus"::text = 'TECH_ELECTRONICS_AND_APPLIANCES' THEN 'ELECTRONICS'::"ProductCategory_new"
    WHEN "categoryFocus"::text = 'SCHOOL_STATIONERY_AND_TOYS' THEN 'SCHOOL_AND_MISC'::"ProductCategory_new"
  END
);

ALTER TABLE "Product"
ALTER COLUMN "category" TYPE "ProductCategory_new"
USING (
  CASE
    WHEN "category"::text = 'PRODUCE' THEN 'FRUIT_AND_VEGETABLES'::"ProductCategory_new"
    WHEN "category"::text = 'BAKERY' THEN 'BAKERY_AND_GRAINS'::"ProductCategory_new"
    WHEN "category"::text = 'PANTRY' THEN 'PANTRY_AND_COOKING'::"ProductCategory_new"
    WHEN "category"::text = 'DRINKS' THEN 'DRINKS'::"ProductCategory_new"
    WHEN "category"::text IN ('MEAT_AND_SEAFOOD', 'DAIRY_AND_EGGS')
      THEN 'MEAT_DAIRY_AND_PROTEIN'::"ProductCategory_new"
    WHEN "category"::text = 'SNACKS_AND_SWEETS' THEN 'SNACKS_AND_SWEETS'::"ProductCategory_new"
    WHEN "category"::text = 'KITCHEN_AND_DINING' THEN 'KITCHEN_AND_COOKWARE'::"ProductCategory_new"
    WHEN "category"::text IN ('PERSONAL_CARE_AND_HEALTH', 'CLEANING_AND_HOUSEHOLD')
      THEN 'CLEANING_AND_PERSONAL_CARE'::"ProductCategory_new"
    WHEN "category"::text = 'CLOTHING_AND_FOOTWEAR' THEN 'CLOTHING'::"ProductCategory_new"
    WHEN "category"::text = 'BABY' THEN 'HOME_AND_STORAGE'::"ProductCategory_new"
    WHEN "category"::text = 'PET' THEN 'HOME_AND_STORAGE'::"ProductCategory_new"
    WHEN "category"::text = 'TECH_ELECTRONICS_AND_APPLIANCES' THEN 'ELECTRONICS'::"ProductCategory_new"
    WHEN "category"::text = 'SCHOOL_STATIONERY_AND_TOYS' THEN 'SCHOOL_AND_MISC'::"ProductCategory_new"
  END
);

ALTER TABLE "BotCustomer"
ALTER COLUMN "preferenceCategory" TYPE "ProductCategory_new"
USING (
  CASE
    WHEN "preferenceCategory"::text = 'PRODUCE' THEN 'FRUIT_AND_VEGETABLES'::"ProductCategory_new"
    WHEN "preferenceCategory"::text = 'BAKERY' THEN 'BAKERY_AND_GRAINS'::"ProductCategory_new"
    WHEN "preferenceCategory"::text = 'PANTRY' THEN 'PANTRY_AND_COOKING'::"ProductCategory_new"
    WHEN "preferenceCategory"::text = 'DRINKS' THEN 'DRINKS'::"ProductCategory_new"
    WHEN "preferenceCategory"::text IN ('MEAT_AND_SEAFOOD', 'DAIRY_AND_EGGS')
      THEN 'MEAT_DAIRY_AND_PROTEIN'::"ProductCategory_new"
    WHEN "preferenceCategory"::text = 'SNACKS_AND_SWEETS' THEN 'SNACKS_AND_SWEETS'::"ProductCategory_new"
    WHEN "preferenceCategory"::text = 'KITCHEN_AND_DINING' THEN 'KITCHEN_AND_COOKWARE'::"ProductCategory_new"
    WHEN "preferenceCategory"::text IN ('PERSONAL_CARE_AND_HEALTH', 'CLEANING_AND_HOUSEHOLD')
      THEN 'CLEANING_AND_PERSONAL_CARE'::"ProductCategory_new"
    WHEN "preferenceCategory"::text = 'CLOTHING_AND_FOOTWEAR' THEN 'CLOTHING'::"ProductCategory_new"
    WHEN "preferenceCategory"::text = 'BABY' THEN 'HOME_AND_STORAGE'::"ProductCategory_new"
    WHEN "preferenceCategory"::text = 'PET' THEN 'HOME_AND_STORAGE'::"ProductCategory_new"
    WHEN "preferenceCategory"::text = 'TECH_ELECTRONICS_AND_APPLIANCES' THEN 'ELECTRONICS'::"ProductCategory_new"
    WHEN "preferenceCategory"::text = 'SCHOOL_STATIONERY_AND_TOYS' THEN 'SCHOOL_AND_MISC'::"ProductCategory_new"
  END
);

ALTER TABLE "MarketEvent"
ALTER COLUMN "category" TYPE "ProductCategory_new"
USING (
  CASE
    WHEN "category" IS NULL THEN NULL
    WHEN "category"::text = 'PRODUCE' THEN 'FRUIT_AND_VEGETABLES'::"ProductCategory_new"
    WHEN "category"::text = 'BAKERY' THEN 'BAKERY_AND_GRAINS'::"ProductCategory_new"
    WHEN "category"::text = 'PANTRY' THEN 'PANTRY_AND_COOKING'::"ProductCategory_new"
    WHEN "category"::text = 'DRINKS' THEN 'DRINKS'::"ProductCategory_new"
    WHEN "category"::text IN ('MEAT_AND_SEAFOOD', 'DAIRY_AND_EGGS')
      THEN 'MEAT_DAIRY_AND_PROTEIN'::"ProductCategory_new"
    WHEN "category"::text = 'SNACKS_AND_SWEETS' THEN 'SNACKS_AND_SWEETS'::"ProductCategory_new"
    WHEN "category"::text = 'KITCHEN_AND_DINING' THEN 'KITCHEN_AND_COOKWARE'::"ProductCategory_new"
    WHEN "category"::text IN ('PERSONAL_CARE_AND_HEALTH', 'CLEANING_AND_HOUSEHOLD')
      THEN 'CLEANING_AND_PERSONAL_CARE'::"ProductCategory_new"
    WHEN "category"::text = 'CLOTHING_AND_FOOTWEAR' THEN 'CLOTHING'::"ProductCategory_new"
    WHEN "category"::text = 'BABY' THEN 'HOME_AND_STORAGE'::"ProductCategory_new"
    WHEN "category"::text = 'PET' THEN 'HOME_AND_STORAGE'::"ProductCategory_new"
    WHEN "category"::text = 'TECH_ELECTRONICS_AND_APPLIANCES' THEN 'ELECTRONICS'::"ProductCategory_new"
    WHEN "category"::text = 'SCHOOL_STATIONERY_AND_TOYS' THEN 'SCHOOL_AND_MISC'::"ProductCategory_new"
  END
);

ALTER TYPE "ProductCategory" RENAME TO "ProductCategory_old";
ALTER TYPE "ProductCategory_new" RENAME TO "ProductCategory";
DROP TYPE "ProductCategory_old";
