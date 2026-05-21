type ProfitInput = {
  sellingUnitPrice: number | null | undefined;
  costUnitPrice: number | null | undefined;
  quantity: number | null | undefined;
};

type CostBasisInput = {
  inventoryAverageUnitCost?: number | null;
  productBasePrice?: number | null;
};

function safeInteger(value: number | null | undefined) {
  return Number.isFinite(value) ? Math.round(Number(value)) : 0;
}

export function getSaleCostUnitPrice({
  inventoryAverageUnitCost,
  productBasePrice,
}: CostBasisInput) {
  const averageCost = safeInteger(inventoryAverageUnitCost);
  if (averageCost > 0) {
    return averageCost;
  }

  return Math.max(0, safeInteger(productBasePrice));
}

export function calculateProfit({
  sellingUnitPrice,
  costUnitPrice,
  quantity,
}: ProfitInput) {
  const safeSellingUnitPrice = safeInteger(sellingUnitPrice);
  const safeCostUnitPrice = safeInteger(costUnitPrice);
  const safeQuantity = Math.max(0, safeInteger(quantity));

  if (safeQuantity === 0) {
    return 0;
  }

  return (safeSellingUnitPrice - safeCostUnitPrice) * safeQuantity;
}

export function calculateLineRevenue({
  sellingUnitPrice,
  quantity,
}: Pick<ProfitInput, "sellingUnitPrice" | "quantity">) {
  return Math.max(0, safeInteger(sellingUnitPrice)) * Math.max(0, safeInteger(quantity));
}
