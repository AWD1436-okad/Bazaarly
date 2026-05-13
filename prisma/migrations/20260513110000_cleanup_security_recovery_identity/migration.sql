-- Account identity cleanup: email is the login identity; usernames are public handles.
DROP INDEX IF EXISTS "User_username_key";
CREATE INDEX IF NOT EXISTS "User_username_idx" ON "User"("username");

-- PINs are private secrets and do not need to be globally unique.
DROP INDEX IF EXISTS "User_checkoutPinLookupHash_key";
CREATE INDEX IF NOT EXISTS "User_checkoutPinLookupHash_idx" ON "User"("checkoutPinLookupHash");

-- Inactive-account tracking and safe soft-disable metadata.
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "inactiveWarning25At" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "inactiveWarning28At" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "inactiveFinalWarningAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "disabledReason" TEXT;

CREATE INDEX IF NOT EXISTS "User_lastActiveAt_deletedAt_idx" ON "User"("lastActiveAt", "deletedAt");

-- Recovery codes support email-code password/PIN reset without exposing old secrets.
DO $$ BEGIN
  CREATE TYPE "RecoveryCodePurpose" AS ENUM ('PASSWORD_RESET', 'PIN_RESET');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "RecoveryCode" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "purpose" "RecoveryCodePurpose" NOT NULL,
  "codeHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RecoveryCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RecoveryCode_codeHash_key" ON "RecoveryCode"("codeHash");
CREATE INDEX IF NOT EXISTS "RecoveryCode_email_purpose_expiresAt_idx" ON "RecoveryCode"("email", "purpose", "expiresAt");
CREATE INDEX IF NOT EXISTS "RecoveryCode_userId_purpose_expiresAt_idx" ON "RecoveryCode"("userId", "purpose", "expiresAt");
CREATE INDEX IF NOT EXISTS "RecoveryCode_expiresAt_usedAt_idx" ON "RecoveryCode"("expiresAt", "usedAt");

DO $$ BEGIN
  ALTER TABLE "RecoveryCode"
  ADD CONSTRAINT "RecoveryCode_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Ledger entries can record non-expense refunds without reducing net-profit math.
ALTER TYPE "BusinessLedgerEntryType" ADD VALUE IF NOT EXISTS 'REFUND';
ALTER TYPE "BusinessLedgerEntryCategory" ADD VALUE IF NOT EXISTS 'FULL_ACCESS_REFUND';
