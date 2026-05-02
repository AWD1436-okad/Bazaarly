CREATE TABLE "ChallengeSet" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "cycleStartAt" TIMESTAMP(3) NOT NULL,
  "cycleEndsAt" TIMESTAMP(3) NOT NULL,
  "challenges" JSONB NOT NULL,
  "rewardedKeys" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ChallengeSet_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChallengeSet_userId_cycleStartAt_key" ON "ChallengeSet"("userId", "cycleStartAt");
CREATE INDEX "ChallengeSet_userId_cycleEndsAt_idx" ON "ChallengeSet"("userId", "cycleEndsAt");

ALTER TABLE "ChallengeSet"
ADD CONSTRAINT "ChallengeSet_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
