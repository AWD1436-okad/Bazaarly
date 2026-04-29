WITH paid_branch_fees AS (
  SELECT
    "userId",
    COUNT(*)::integer AS fee_count
  FROM "Notification"
  WHERE "type" = 'SYSTEM'
    AND "message" LIKE 'Your shop is now available for branch requests in %.'
  GROUP BY "userId"
),
refunded_users AS (
  UPDATE "User" AS u
  SET "balance" = u."balance" + paid_branch_fees.fee_count * 150000
  FROM paid_branch_fees
  WHERE u."id" = paid_branch_fees."userId"
  RETURNING u."id" AS "userId", paid_branch_fees.fee_count
)
INSERT INTO "Notification" ("id", "userId", "type", "message", "read", "createdAt")
SELECT
  'branch_refund_' || substr(md5(refunded_users."userId" || '-' || fee_number::text), 1, 20),
  refunded_users."userId",
  'SYSTEM',
  'Branching has been removed. Your $1,500 branch fee has been refunded.',
  false,
  NOW()
FROM refunded_users
CROSS JOIN generate_series(1, refunded_users.fee_count) AS fee_number;

DROP TABLE IF EXISTS "BranchRequest";

ALTER TABLE "Shop" DROP CONSTRAINT IF EXISTS "Shop_parentShopId_fkey";

ALTER TABLE "Shop"
DROP COLUMN IF EXISTS "availableToBranch",
DROP COLUMN IF EXISTS "branchLocation",
DROP COLUMN IF EXISTS "parentShopId";

DROP TYPE IF EXISTS "BranchRequestStatus";
