import { AutoRestockPlan } from "@prisma/client";

export const SIMPLE_DAILY_COST_CENTS = 50_000;
export const SIMPLE_SETUP_FEE_CENTS = 30_000;
export const PRO_DAILY_COST_CENTS = 75_000;
export const MAX_DAILY_COST_CENTS = 150_000;

export const AUTO_RESTOCK_PLAN_META: Record<
  AutoRestockPlan,
  {
    name: string;
    dailyCostCents: number;
    setupFeeCents: number;
    minIntervalMs: number;
    maxIntervalMs: number;
    defaultQuantity: number;
  }
> = {
  SIMPLE: {
    name: "Simple",
    dailyCostCents: SIMPLE_DAILY_COST_CENTS,
    setupFeeCents: SIMPLE_SETUP_FEE_CENTS,
    minIntervalMs: 60_000,
    maxIntervalMs: 120_000,
    defaultQuantity: 1,
  },
  PRO: {
    name: "Pro",
    dailyCostCents: PRO_DAILY_COST_CENTS,
    setupFeeCents: 0,
    minIntervalMs: 3 * 60_000,
    maxIntervalMs: 5 * 60_000,
    defaultQuantity: 2,
  },
  MAX: {
    name: "Max",
    dailyCostCents: MAX_DAILY_COST_CENTS,
    setupFeeCents: 0,
    minIntervalMs: 60_000,
    maxIntervalMs: 2 * 60_000,
    defaultQuantity: 3,
  },
};

export function getPlanMeta(plan: AutoRestockPlan) {
  return AUTO_RESTOCK_PLAN_META[plan];
}

export function getNextRestockDelayMs(plan: AutoRestockPlan) {
  const meta = getPlanMeta(plan);
  const range = Math.max(0, meta.maxIntervalMs - meta.minIntervalMs);
  return meta.minIntervalMs + Math.floor(Math.random() * (range + 1));
}
