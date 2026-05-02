import { AutoRestockRequestStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { getSessionUser, hasCompletedSecuritySetup } from "@/lib/auth";
import { getPlanMeta } from "@/lib/auto-restock";
import { formatCurrency } from "@/lib/money";
import { getActiveCurrencyCode } from "@/lib/price-profiles";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "syd1";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user || !hasCompletedSecuritySetup(user)) {
    return NextResponse.json({ ok: true, pending: null });
  }

  const currencyCode = await getActiveCurrencyCode(user.id);
  const pending = await prisma.autoRestockRequest.findFirst({
    where: {
      userId: user.id,
      status: AutoRestockRequestStatus.PENDING,
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              unitLabel: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!pending) {
    return NextResponse.json({ ok: true, pending: null });
  }

  const planMeta = getPlanMeta(pending.plan);
  return NextResponse.json({
    ok: true,
    pending: {
      id: pending.id,
      plan: pending.plan,
      planName: planMeta.name,
      estimatedCost: formatCurrency(pending.estimatedCostCents, currencyCode),
      estimatedCostCents: pending.estimatedCostCents,
      currentBalance: formatCurrency(user.balance, currencyCode),
      currentBalanceCents: user.balance,
      balanceAfterCents: user.balance - pending.estimatedCostCents,
      balanceAfter: formatCurrency(user.balance - pending.estimatedCostCents, currencyCode),
      canSkip: pending.plan !== "MAX",
      items: pending.items.map((item) => ({
        id: item.id,
        name: item.product.name,
        quantity: item.quantity,
        unitLabel: item.product.unitLabel,
        lineTotal: formatCurrency(item.lineTotal, currencyCode),
      })),
      createdAt: pending.createdAt.toISOString(),
    },
  });
}
