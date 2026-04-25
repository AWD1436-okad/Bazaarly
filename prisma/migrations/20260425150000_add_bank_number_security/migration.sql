ALTER TABLE "User" ADD COLUMN "bankNumberHash" TEXT;
ALTER TABLE "User" ADD COLUMN "bankNumberLookupHash" TEXT;

CREATE UNIQUE INDEX "User_bankNumberLookupHash_key" ON "User"("bankNumberLookupHash");
