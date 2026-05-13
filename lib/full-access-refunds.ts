import {
  AutoRestockPlan,
  BusinessLedgerEntryCategory,
  BusinessLedgerEntryType,
  NotificationType,
  Prisma,
} from "@prisma/client";

import { FORMER_FULL_ACCESS_48H_COST_CENTS, getPlanMeta } from "@/lib/auto-restock";
import { recordBusinessRefund } from "@/lib/business-ledger";
import { formatCurrency } from "@/lib/money";
import { prisma } from "@/lib/prisma";

const REFUND_SOURCE = "full_access_is_free_refund_2026_05";

function getPlanFromData(data: Prisma.JsonValue | null): AutoRestockPlan | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const plan = (data as { plan?: unknown }).plan;
  return plan === "SIMPLE" || plan === "PRO" || plan === "MAX" ? plan : null;
}

function wasFullAccessCharge(data: Prisma.JsonValue | null, description: string) {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const raw = data as { fullAccessEnabled?: unknown; source?: unknown };
    if (raw.fullAccessEnabled === true && raw.source === "auto_restock_48_hour_charge") {
      return true;
    }
  }
  return description.toLowerCase().includes("with full access");
}

export async function refundFullAccessSurcharges() {
  const chargedUsers = await prisma.businessLedgerEntry.groupBy({
    by: ["userId"],
    where: {
      type: BusinessLedgerEntryType.EXPENSE,
      category: BusinessLedgerEntryCategory.SUBSCRIPTION_FEE,
    },
  });

  let refundedUsers = 0;
  let refundedCents = 0;

  for (const { userId } of chargedUsers) {
    const existingRefund = await prisma.businessLedgerEntry.findFirst({
      where: {
        userId,
        type: BusinessLedgerEntryType.REFUND,
        category: BusinessLedgerEntryCategory.FULL_ACCESS_REFUND,
      },
      select: { id: true },
    });
    if (existingRefund) continue;

    const charges = await prisma.businessLedgerEntry.findMany({
      where: {
        userId,
        type: BusinessLedgerEntryType.EXPENSE,
        category: BusinessLedgerEntryCategory.SUBSCRIPTION_FEE,
      },
      select: {
        amount: true,
        description: true,
        data: true,
      },
    });

    let refundAmount = 0;
    for (const charge of charges) {
      if (!wasFullAccessCharge(charge.data, charge.description)) continue;
      const plan = getPlanFromData(charge.data);
      if (plan) {
        refundAmount += Math.max(0, charge.amount - getPlanMeta(plan).dailyCostCents);
      } else {
        refundAmount += FORMER_FULL_ACCESS_48H_COST_CENTS;
      }
    }

    if (refundAmount <= 0) continue;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currencyCode: true },
    });
    const currencyCode = user?.currencyCode ?? "AUD";

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          balance: { increment: refundAmount },
        },
      });

      await recordBusinessRefund(tx, {
        userId,
        category: BusinessLedgerEntryCategory.FULL_ACCESS_REFUND,
        amount: refundAmount,
        description: "Full Access refund",
        data: {
          source: REFUND_SOURCE,
          formerSurchargeCents: FORMER_FULL_ACCESS_48H_COST_CENTS,
        },
      });

      await tx.notification.create({
        data: {
          userId,
          type: NotificationType.SYSTEM,
          message: `Full Access refund: ${formatCurrency(refundAmount, currencyCode)}. Full Access is now free.`,
        },
      });
    });

    refundedUsers += 1;
    refundedCents += refundAmount;
  }

  return { refundedUsers, refundedCents };
}
