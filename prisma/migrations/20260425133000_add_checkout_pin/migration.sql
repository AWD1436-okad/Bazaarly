ALTER TABLE "User" ADD COLUMN "checkoutPinHash" TEXT;
ALTER TABLE "User" ADD COLUMN "checkoutPinLookupHash" TEXT;

CREATE UNIQUE INDEX "User_checkoutPinLookupHash_key" ON "User"("checkoutPinLookupHash");
