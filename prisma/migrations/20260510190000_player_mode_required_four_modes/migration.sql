ALTER TYPE "PlayerMode" RENAME TO "PlayerMode_old";

CREATE TYPE "PlayerMode" AS ENUM ('LITTLE', 'JUNIOR', 'YOUNG', 'ADVANCED');

ALTER TABLE "User"
ADD COLUMN "playerModeConfirmed" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "User"
ALTER COLUMN "playerMode" DROP DEFAULT;

ALTER TABLE "User"
ALTER COLUMN "playerMode" DROP NOT NULL;

ALTER TABLE "User"
ALTER COLUMN "playerMode" TYPE "PlayerMode"
USING (
  CASE
    WHEN "playerMode"::text = 'TEEN' THEN 'ADVANCED'
    WHEN "playerMode"::text IN ('LITTLE', 'JUNIOR') THEN "playerMode"::text
    ELSE NULL
  END
)::"PlayerMode";

DROP TYPE "PlayerMode_old";
