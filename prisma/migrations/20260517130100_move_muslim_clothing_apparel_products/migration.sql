UPDATE "Product"
SET
  "category" = 'MUSLIM_CLOTHING_AND_APPAREL'::"ProductCategory",
  "subcategory" = 'Muslim Clothing & Apparel',
  "sku" = regexp_replace("sku", '^clothing-', 'muslimclothing-')
WHERE "subcategory" IN ('Men Muslim Clothes', 'Female Muslim Clothes');

UPDATE "Product"
SET "subcategory" = NULL
WHERE "category" = 'CLOTHING'::"ProductCategory"
  AND "subcategory" IN ('Other Clothes', 'Clothing', 'Clothing & Apparel');
