ALTER TABLE "AutoRestockSubscription"
ADD COLUMN "restockIntervalMinutes" INTEGER;

UPDATE "AutoRestockSubscription"
SET "restockIntervalMinutes" = CASE
  WHEN "plan" = 'SIMPLE' THEN 5
  WHEN "plan" = 'PRO' THEN 5
  WHEN "plan" = 'MAX' THEN 3
  ELSE NULL
END
WHERE "restockIntervalMinutes" IS NULL;
