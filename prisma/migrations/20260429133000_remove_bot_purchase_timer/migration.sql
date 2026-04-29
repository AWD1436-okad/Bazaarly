DROP INDEX IF EXISTS "BotCustomer_active_nextPurchaseAt_idx";

ALTER TABLE "BotCustomer"
DROP COLUMN IF EXISTS "nextPurchaseAt";

CREATE INDEX IF NOT EXISTS "BotCustomer_active_lastAttemptedAt_idx"
ON "BotCustomer"("active", "lastAttemptedAt");
