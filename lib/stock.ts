export function sanitizeStockCount(quantity: number | null | undefined) {
  if (typeof quantity !== "number" || Number.isNaN(quantity)) {
    return 0;
  }

  return Math.max(0, Math.floor(quantity));
}

export function getLiveStockStatusMessage(quantity: number | null | undefined) {
  const safeQuantity = sanitizeStockCount(quantity);

  if (safeQuantity <= 0) {
    return "You don't have any of this item left";
  }

  if (safeQuantity <= 3) {
    return `Low stock remaining: ${safeQuantity} left`;
  }

  return `${safeQuantity} left in your live listing`;
}

export function getStockAvailabilityLabel(quantity: number | null | undefined) {
  const safeQuantity = sanitizeStockCount(quantity);

  if (safeQuantity <= 0) {
    return "Out of stock";
  }

  return `${safeQuantity} in stock`;
}
