WITH ranked_active_carts AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "userId"
      ORDER BY "updatedAt" DESC, "createdAt" DESC, "id" DESC
    ) AS "rank"
  FROM "Cart"
  WHERE "status" = 'ACTIVE'
)
UPDATE "Cart"
SET "status" = 'ABANDONED'
WHERE "id" IN (
  SELECT "id"
  FROM ranked_active_carts
  WHERE "rank" > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS "Cart_active_userId_key"
ON "Cart"("userId")
WHERE "status" = 'ACTIVE';
