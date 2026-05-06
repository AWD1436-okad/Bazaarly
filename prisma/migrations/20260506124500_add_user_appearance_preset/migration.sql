ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "appearancePreset" TEXT NOT NULL DEFAULT 'current-tradex';
