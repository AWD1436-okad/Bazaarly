-- Add persisted bot timers so each bot can run on its own schedule.
ALTER TABLE "BotCustomer"
ADD COLUMN "lastAttemptedAt" TIMESTAMP(3),
ADD COLUMN "nextPurchaseAt" TIMESTAMP(3);

CREATE INDEX "BotCustomer_active_nextPurchaseAt_idx"
ON "BotCustomer"("active", "nextPurchaseAt");
