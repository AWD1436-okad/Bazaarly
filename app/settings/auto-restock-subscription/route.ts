import {
  AutoRestockPlan,
  AutoRestockSubscriptionStatus,
  BusinessLedgerEntryCategory,
  NotificationType,
} from "@prisma/client";
import { addHours } from "date-fns";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSessionUser, hasCompletedSecuritySetup } from "@/lib/auth";
import { getAutoRestockRenewalCostCents, getPlanMeta } from "@/lib/auto-restock";
import { recordBusinessExpense } from "@/lib/business-ledger";
import { formatCurrency } from "@/lib/money";
import { getActiveCurrencyCode } from "@/lib/price-profiles";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

function parsePlan(raw: string): AutoRestockPlan | null {
  if (raw === "SIMPLE" || raw === "PRO" || raw === "MAX") {
    return raw;
  }
  return null;
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Login required" }, { status: 401 });
  }
  if (!hasCompletedSecuritySetup(user)) {
    return NextResponse.json({ ok: false, error: "Complete security setup first" }, { status: 403 });
  }

  const formData = await request.formData();
  const action = String(formData.get("action") ?? "");
  const requestedPlan = parsePlan(String(formData.get("plan") ?? "").toUpperCase());
  const confirmReplace = String(formData.get("confirmReplace") ?? "false").toLowerCase() === "true";
  const now = new Date();
  const currencyCode = await getActiveCurrencyCode(user.id);

  if (action === "cancel") {
    await prisma.autoRestockSubscription.updateMany({
      where: {
        userId: user.id,
        status: AutoRestockSubscriptionStatus.ACTIVE,
      },
      data: {
        status: AutoRestockSubscriptionStatus.CANCELLED,
      },
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: NotificationType.SYSTEM,
        message: "Auto Restock subscription cancelled.",
      },
    });

    revalidatePath("/settings");
    return NextResponse.json({ ok: true, message: "Subscription cancelled" });
  }

  if (action !== "activate" || !requestedPlan) {
    return NextResponse.json({ ok: false, error: "Invalid subscription action" }, { status: 400 });
  }

  const planMeta = getPlanMeta(requestedPlan);

  const result = await prisma.$transaction(async (tx) => {
    const freshUser = await tx.user.findUnique({
      where: { id: user.id },
      select: { id: true, balance: true },
    });
    if (!freshUser) {
      throw new Error("User not found");
    }

    const existing = await tx.autoRestockSubscription.findUnique({
      where: { userId: user.id },
    });

    if (existing?.status === AutoRestockSubscriptionStatus.ACTIVE && existing.plan === requestedPlan) {
      return {
        alreadyActive: true,
        requiresReplaceConfirmation: false,
        existingPlan: existing.plan,
      };
    }

    if (existing?.status === AutoRestockSubscriptionStatus.ACTIVE && !confirmReplace && existing.plan !== requestedPlan) {
      return {
        alreadyActive: false,
        requiresReplaceConfirmation: true,
        existingPlan: existing.plan,
      };
    }

    const setupFee = 0;
    const upfrontCharge = planMeta.dailyCostCents + setupFee;

    if (freshUser.balance < upfrontCharge) {
      throw new Error("Not enough balance to start this Auto Restock plan");
    }

    await tx.user.update({
      where: { id: user.id },
      data: {
        balance: {
          decrement: upfrontCharge,
        },
      },
    });

    await recordBusinessExpense(tx, {
      userId: user.id,
      category: BusinessLedgerEntryCategory.SUBSCRIPTION_FEE,
      amount: planMeta.dailyCostCents,
      description: `${planMeta.name} Auto Restock first 48-hour fee`,
      data: {
        source: "auto_restock_subscription",
        plan: requestedPlan,
      },
    });

    if (setupFee > 0) {
      await recordBusinessExpense(tx, {
        userId: user.id,
        category: BusinessLedgerEntryCategory.FEATURE_FEE,
        amount: setupFee,
        description: "Simple Auto Restock setup fee",
        data: {
          source: "auto_restock_subscription_setup",
          plan: requestedPlan,
        },
      });
    }

    const nextChargeAt = addHours(now, 48);
    await tx.autoRestockSubscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        plan: requestedPlan,
        status: AutoRestockSubscriptionStatus.ACTIVE,
        dailyCostCents: getAutoRestockRenewalCostCents(requestedPlan, false),
        setupFeeCents: setupFee,
        nextChargeAt,
        lastChargedAt: now,
        fullAccessEnabled: false,
      },
      update: {
        plan: requestedPlan,
        status: AutoRestockSubscriptionStatus.ACTIVE,
        dailyCostCents: getAutoRestockRenewalCostCents(requestedPlan, false),
        setupFeeCents: setupFee,
        nextChargeAt,
        lastChargedAt: now,
        fullAccessEnabled: false,
      },
    });

    await tx.notification.create({
      data: {
        userId: user.id,
        type: NotificationType.SYSTEM,
        message:
          setupFee > 0
            ? `Simple Auto Restock started. Charged ${formatCurrency(
                upfrontCharge,
                currencyCode,
              )} (includes ${formatCurrency(setupFee, currencyCode)} setup fee).`
            : `${planMeta.name} Auto Restock started. Charged ${formatCurrency(
                upfrontCharge,
                currencyCode,
              )} for 48 hours.`,
      },
    });

    return {
      alreadyActive: false,
      requiresReplaceConfirmation: false,
      existingPlan: existing?.plan ?? null,
    };
  });

  if (result.alreadyActive) {
    return NextResponse.json({
      ok: true,
      message: `${planMeta.name} Auto Restock is already active`,
    });
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  if (result.requiresReplaceConfirmation) {
    return NextResponse.json(
      {
        ok: false,
        requiresReplaceConfirmation: true,
        error: `You already have ${result.existingPlan} active. Confirm replacement to continue.`,
      },
      { status: 409 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: `${planMeta.name} Auto Restock activated`,
  });
}
