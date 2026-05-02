-- Track when a listing first becomes sold out so the app can clean it up safely later.
ALTER TABLE "Listing" ADD COLUMN "soldOutAt" TIMESTAMP(3);

CREATE INDEX "Listing_active_isPaused_quantity_soldOutAt_idx"
ON "Listing"("active", "isPaused", "quantity", "soldOutAt");
