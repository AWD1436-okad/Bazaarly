ALTER TABLE "Cart"
ADD COLUMN "autoRestockPlan" "AutoRestockPlan",
ADD COLUMN "autoRestockPlanPrice" INTEGER,
ADD COLUMN "autoRestockIntervalMinutes" INTEGER;
