import { AutoRestockPlan } from "@prisma/client";

export const SIMPLE_DAILY_COST_CENTS = 50_000;
export const SIMPLE_SETUP_FEE_CENTS = 0;
export const PRO_DAILY_COST_CENTS = 75_000;
export const MAX_DAILY_COST_CENTS = 150_000;
export const FORMER_FULL_ACCESS_48H_COST_CENTS = 25_000;
export const FULL_ACCESS_48H_COST_CENTS = 0;

export const SIMPLE_RESTOCK_INTERVAL_MINUTES = 5;
export const PRO_DEFAULT_RESTOCK_INTERVAL_MINUTES = 5;
export const MAX_DEFAULT_RESTOCK_INTERVAL_MINUTES = 3;

export const AUTO_RESTOCK_INTERVAL_LIMITS: Record<
  AutoRestockPlan,
  {
    min: number;
    max: number;
    defaultValue: number;
    customizable: boolean;
  }
> = {
  SIMPLE: {
    min: SIMPLE_RESTOCK_INTERVAL_MINUTES,
    max: SIMPLE_RESTOCK_INTERVAL_MINUTES,
    defaultValue: SIMPLE_RESTOCK_INTERVAL_MINUTES,
    customizable: false,
  },
  PRO: {
    min: 2,
    max: 10,
    defaultValue: PRO_DEFAULT_RESTOCK_INTERVAL_MINUTES,
    customizable: true,
  },
  MAX: {
    min: 1,
    max: 20,
    defaultValue: MAX_DEFAULT_RESTOCK_INTERVAL_MINUTES,
    customizable: true,
  },
};

export const AUTO_RESTOCK_PLAN_META: Record<
  AutoRestockPlan,
  {
    name: string;
    dailyCostCents: number;
    setupFeeCents: number;
    cycleLabel: string;
    defaultQuantity: number;
    coveragePercent: number;
  }
> = {
  SIMPLE: {
    name: "Simple",
    dailyCostCents: SIMPLE_DAILY_COST_CENTS,
    setupFeeCents: SIMPLE_SETUP_FEE_CENTS,
    cycleLabel: "Checks every 5 minutes",
    defaultQuantity: 1,
    coveragePercent: 0.5,
  },
  PRO: {
    name: "Pro",
    dailyCostCents: PRO_DAILY_COST_CENTS,
    setupFeeCents: 0,
    cycleLabel: "Checks on your custom interval",
    defaultQuantity: 2,
    coveragePercent: 0.75,
  },
  MAX: {
    name: "Max",
    dailyCostCents: MAX_DAILY_COST_CENTS,
    setupFeeCents: 0,
    cycleLabel: "Checks on your custom interval",
    defaultQuantity: 3,
    coveragePercent: 1,
  },
};

export function getPlanMeta(plan: AutoRestockPlan) {
  return AUTO_RESTOCK_PLAN_META[plan];
}

export function getAutoRestockRenewalCostCents(plan: AutoRestockPlan, fullAccessEnabled: boolean) {
  void fullAccessEnabled;
  return getPlanMeta(plan).dailyCostCents;
}

export function normalizeRestockIntervalMinutes(
  plan: AutoRestockPlan,
  intervalMinutes?: number | null,
) {
  const limits = AUTO_RESTOCK_INTERVAL_LIMITS[plan];
  if (!limits.customizable) {
    return limits.defaultValue;
  }

  const parsed = Number.isFinite(intervalMinutes) ? Number(intervalMinutes) : limits.defaultValue;
  return Math.min(limits.max, Math.max(limits.min, Math.round(parsed)));
}

export function getRestockCycleMs(plan: AutoRestockPlan, intervalMinutes?: number | null) {
  return normalizeRestockIntervalMinutes(plan, intervalMinutes) * 60_000;
}

export function getRestockCoveragePercent(plan: AutoRestockPlan) {
  return getPlanMeta(plan).coveragePercent;
}

export function getRestockCoverageLabel(plan: AutoRestockPlan) {
  return `${Math.round(getRestockCoveragePercent(plan) * 100)}% coverage`;
}

export function getRestockCycleLabel(plan: AutoRestockPlan, intervalMinutes?: number | null) {
  const normalized = normalizeRestockIntervalMinutes(plan, intervalMinutes);
  return `Checks every ${normalized} ${normalized === 1 ? "minute" : "minutes"}`;
}

export function getNextRestockAt(
  plan: AutoRestockPlan,
  subscription: {
    lastRestockAt?: Date | null;
    lastChargedAt?: Date | null;
    startedAt?: Date | null;
    createdAt?: Date | null;
    restockIntervalMinutes?: number | null;
  },
  now = new Date(),
) {
  const intervalMs = getRestockCycleMs(plan, subscription.restockIntervalMinutes);

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
    restockIntervalMinutes?: number | null;
  },
  now = new Date(),
) {
  const intervalMs = getRestockCycleMs(plan, subscription.restockIntervalMinutes);

  const anchor =
    subscription.lastRestockAt ??
    subscription.lastChargedAt ??
    subscription.startedAt ??
    subscription.createdAt ??
    now;

  return now.getTime() - anchor.getTime() >= intervalMs;
}

export function getNextRestockDelayMs(plan: AutoRestockPlan, intervalMinutes?: number | null) {
  return getRestockCycleMs(plan, intervalMinutes);
}
