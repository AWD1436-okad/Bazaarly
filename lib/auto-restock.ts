import { AutoRestockPlan } from "@prisma/client";

export const SIMPLE_DAILY_COST_CENTS = 50_000;
export const SIMPLE_SETUP_FEE_CENTS = 0;
export const PRO_DAILY_COST_CENTS = 75_000;
export const MAX_DAILY_COST_CENTS = 150_000;

export const AUTO_RESTOCK_PLAN_META: Record<
  AutoRestockPlan,
  {
    name: string;
    dailyCostCents: number;
    setupFeeCents: number;
    cycleIntervalMs: number | null;
    cycleLabel: string;
    defaultQuantity: number;
  }
> = {
  SIMPLE: {
    name: "Simple",
    dailyCostCents: SIMPLE_DAILY_COST_CENTS,
    setupFeeCents: SIMPLE_SETUP_FEE_CENTS,
    cycleIntervalMs: 2 * 60_000,
    cycleLabel: "Checks every 2 minutes",
    defaultQuantity: 1,
  },
  PRO: {
    name: "Pro",
    dailyCostCents: PRO_DAILY_COST_CENTS,
    setupFeeCents: 0,
    cycleIntervalMs: 60_000,
    cycleLabel: "Checks every 1 minute",
    defaultQuantity: 2,
  },
  MAX: {
    name: "Max",
    dailyCostCents: MAX_DAILY_COST_CENTS,
    setupFeeCents: 0,
    cycleIntervalMs: null,
    cycleLabel: "Restocks when an item sells out",
    defaultQuantity: 3,
  },
};

export function getPlanMeta(plan: AutoRestockPlan) {
  return AUTO_RESTOCK_PLAN_META[plan];
}

export function getRestockCycleMs(plan: AutoRestockPlan) {
  return getPlanMeta(plan).cycleIntervalMs;
}

export function getNextRestockAt(
  plan: AutoRestockPlan,
  subscription: {
    lastRestockAt?: Date | null;
    lastChargedAt?: Date | null;
    startedAt?: Date | null;
    createdAt?: Date | null;
  },
  now = new Date(),
) {
  const intervalMs = getRestockCycleMs(plan);
  if (intervalMs === null) {
    return null;
  }

  const anchor =
    subscription.lastRestockAt ??
    subscription.lastChargedAt ??
    subscription.startedAt ??
    subscription.createdAt ??
    now;
  const firstDueAt = new Date(anchor.getTime() + intervalMs);
  return firstDueAt;
}

export function isRestockCycleDue(
  plan: AutoRestockPlan,
  subscription: {
    lastRestockAt?: Date | null;
    lastChargedAt?: Date | null;
    startedAt?: Date | null;
    createdAt?: Date | null;
  },
  now = new Date(),
) {
  const intervalMs = getRestockCycleMs(plan);
  if (intervalMs === null) {
    return true;
  }

  const anchor =
    subscription.lastRestockAt ??
    subscription.lastChargedAt ??
    subscription.startedAt ??
    subscription.createdAt ??
    now;

  return now.getTime() - anchor.getTime() >= intervalMs;
}

export function getNextRestockDelayMs(plan: AutoRestockPlan) {
  return getRestockCycleMs(plan) ?? Number.POSITIVE_INFINITY;
}
