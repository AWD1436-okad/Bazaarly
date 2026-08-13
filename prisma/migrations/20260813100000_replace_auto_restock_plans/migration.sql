-- Preserve active subscriptions and carts while replacing the original three-plan enum.
ALTER TYPE "AutoRestockPlan" RENAME TO "AutoRestockPlan_old";

CREATE TYPE "AutoRestockPlan" AS ENUM ('STARTER', 'ESSENTIAL', 'PLUS', 'PRO', 'ULTIMATE');

ALTER TABLE "AutoRestockSubscription"
  ALTER COLUMN "plan" TYPE "AutoRestockPlan"
  USING (
    CASE "plan"::text
      WHEN 'SIMPLE' THEN 'PLUS'
      WHEN 'PRO' THEN 'PRO'
      WHEN 'MAX' THEN 'ULTIMATE'
    END
  )::"AutoRestockPlan";

ALTER TABLE "AutoRestockRequest"
  ALTER COLUMN "plan" TYPE "AutoRestockPlan"
  USING (
    CASE "plan"::text
      WHEN 'SIMPLE' THEN 'PLUS'
      WHEN 'PRO' THEN 'PRO'
      WHEN 'MAX' THEN 'ULTIMATE'
    END
  )::"AutoRestockPlan";

ALTER TABLE "Cart"
  ALTER COLUMN "autoRestockPlan" TYPE "AutoRestockPlan"
  USING (
    CASE "autoRestockPlan"::text
      WHEN 'SIMPLE' THEN 'PLUS'
      WHEN 'PRO' THEN 'PRO'
      WHEN 'MAX' THEN 'ULTIMATE'
      ELSE NULL
    END
  )::"AutoRestockPlan";

DROP TYPE "AutoRestockPlan_old";

-- Existing plans keep their equivalent coverage, then use the new published 24-hour price.
UPDATE "AutoRestockSubscription"
SET
  "dailyCostCents" = CASE "plan"
    WHEN 'STARTER' THEN 7500
    WHEN 'ESSENTIAL' THEN 20000
    WHEN 'PLUS' THEN 50000
    WHEN 'PRO' THEN 80000
    WHEN 'ULTIMATE' THEN 150000
  END,
  "setupFeeCents" = 0,
  "restockIntervalMinutes" = 10;

UPDATE "Cart"
SET
  "autoRestockPlanPrice" = CASE "autoRestockPlan"
    WHEN 'STARTER' THEN 7500
    WHEN 'ESSENTIAL' THEN 20000
    WHEN 'PLUS' THEN 50000
    WHEN 'PRO' THEN 80000
    WHEN 'ULTIMATE' THEN 150000
    ELSE NULL
  END,
  "autoRestockIntervalMinutes" = CASE
    WHEN "autoRestockPlan" IS NULL THEN NULL
    ELSE 10
  END
WHERE "status" = 'ACTIVE';
