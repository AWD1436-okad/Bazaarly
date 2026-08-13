import { AutoRestockPlan } from "@prisma/client";

export const STARTER_DAILY_COST_CENTS = 7_500;
export const ESSENTIAL_DAILY_COST_CENTS = 20_000;
export const PLUS_DAILY_COST_CENTS = 50_000;
export const PRO_DAILY_COST_CENTS = 80_000;
export const ULTIMATE_DAILY_COST_CENTS = 150_000;
export const FORMER_FULL_ACCESS_48H_COST_CENTS = 25_000;
export const FULL_ACCESS_48H_COST_CENTS = 0;

// Plans are charged every 24 hours; this is the internal cadence for checking low stock.
export const AUTO_RESTOCK_CHECK_INTERVAL_MINUTES = 10;
export const AUTO_RESTOCK_RENEWAL_HOURS = 24;

export const AUTO_RESTOCK_INTERVAL_LIMITS: Record<
  AutoRestockPlan,
  {
    min: number;
    max: number;
    defaultValue: number;
    customizable: boolean;
  }
> = {
  STARTER: {
    min: AUTO_RESTOCK_CHECK_INTERVAL_MINUTES,
    max: AUTO_RESTOCK_CHECK_INTERVAL_MINUTES,
    defaultValue: AUTO_RESTOCK_CHECK_INTERVAL_MINUTES,
    customizable: false,
  },
  ESSENTIAL: {
    min: AUTO_RESTOCK_CHECK_INTERVAL_MINUTES,
    max: AUTO_RESTOCK_CHECK_INTERVAL_MINUTES,
    defaultValue: AUTO_RESTOCK_CHECK_INTERVAL_MINUTES,
    customizable: false,
  },
  PLUS: {
    min: AUTO_RESTOCK_CHECK_INTERVAL_MINUTES,
    max: AUTO_RESTOCK_CHECK_INTERVAL_MINUTES,
    defaultValue: AUTO_RESTOCK_CHECK_INTERVAL_MINUTES,
    customizable: false,
  },
  PRO: {
    min: AUTO_RESTOCK_CHECK_INTERVAL_MINUTES,
    max: AUTO_RESTOCK_CHECK_INTERVAL_MINUTES,
    defaultValue: AUTO_RESTOCK_CHECK_INTERVAL_MINUTES,
    customizable: false,
  },
  ULTIMATE: {
    min: AUTO_RESTOCK_CHECK_INTERVAL_MINUTES,
    max: AUTO_RESTOCK_CHECK_INTERVAL_MINUTES,
    defaultValue: AUTO_RESTOCK_CHECK_INTERVAL_MINUTES,
    customizable: false,
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
    triggerQuantity: number;
  }
> = {
  STARTER: {
    name: "Starter",
    dailyCostCents: STARTER_DAILY_COST_CENTS,
    setupFeeCents: 0,
    cycleLabel: "Checks stock every 10 minutes",
    defaultQuantity: 1,
    coveragePercent: 0.1,
    triggerQuantity: 0,
  },
  ESSENTIAL: {
    name: "Essential",
    dailyCostCents: ESSENTIAL_DAILY_COST_CENTS,
    setupFeeCents: 0,
    cycleLabel: "Checks stock every 10 minutes",
    defaultQuantity: 1,
    coveragePercent: 0.25,
    triggerQuantity: 2,
  },
  PLUS: {
    name: "Plus",
    dailyCostCents: PLUS_DAILY_COST_CENTS,
    setupFeeCents: 0,
    cycleLabel: "Checks stock every 10 minutes",
    defaultQuantity: 2,
    coveragePercent: 0.5,
    triggerQuantity: 5,
  },
  PRO: {
    name: "Pro",
    dailyCostCents: PRO_DAILY_COST_CENTS,
    setupFeeCents: 0,
    cycleLabel: "Checks stock every 10 minutes",
    defaultQuantity: 3,
    coveragePercent: 0.75,
    triggerQuantity: 8,
  },
  ULTIMATE: {
    name: "Ultimate",
    dailyCostCents: ULTIMATE_DAILY_COST_CENTS,
    setupFeeCents: 0,
    cycleLabel: "Checks stock every 10 minutes",
    defaultQuantity: 4,
    coveragePercent: 1,
    triggerQuantity: 10,
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
  return `${Math.round(getRestockCoveragePercent(plan) * 100)}% per 24 hours`;
}

export function getRestockTriggerQuantity(plan: AutoRestockPlan) {
  return getPlanMeta(plan).triggerQuantity;
}

export function getRestockTriggerLabel(plan: AutoRestockPlan) {
  const trigger = getRestockTriggerQuantity(plan);
  return trigger === 0 ? "When sold out" : `When ${trigger} or fewer are left`;
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
