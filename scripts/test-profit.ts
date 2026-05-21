import assert from "node:assert/strict";

import { calculateProfit, getSaleCostUnitPrice } from "@/lib/profit";

assert.equal(
  calculateProfit({ sellingUnitPrice: 500, costUnitPrice: 200, quantity: 10 }),
  3000,
  "$2 cost, $5 sale, quantity 10 should produce $30 profit",
);

assert.equal(
  calculateProfit({ sellingUnitPrice: 1000, costUnitPrice: 1000, quantity: 5 }),
  0,
  "Selling at cost should produce zero profit",
);

assert.equal(
  calculateProfit({ sellingUnitPrice: 500, costUnitPrice: 800, quantity: 3 }),
  -900,
  "Selling below cost should show the loss instead of hiding it",
);

assert.equal(
  getSaleCostUnitPrice({ inventoryAverageUnitCost: 0, productBasePrice: 225 }),
  225,
  "Missing average cost should fall back to product base price",
);

assert.equal(
  getSaleCostUnitPrice({ inventoryAverageUnitCost: 180, productBasePrice: 225 }),
  180,
  "Real average unit cost should win over product base price",
);

assert.equal(
  calculateProfit({ sellingUnitPrice: Number.NaN, costUnitPrice: null, quantity: undefined }),
  0,
  "Bad values must not produce NaN",
);

console.log("Profit calculation tests passed.");
