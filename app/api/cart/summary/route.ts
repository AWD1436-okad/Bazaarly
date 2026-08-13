import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/money";
import { getActiveCurrencyCode } from "@/lib/price-profiles";
import { prisma } from "@/lib/prisma";
import { getPlanMeta } from "@/lib/auto-restock";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Login required" }, { status: 401 });
  }

  const [currencyCode, cart] = await Promise.all([
    getActiveCurrencyCode(user.id),
    prisma.cart.findFirst({
      where: { userId: user.id, status: "ACTIVE" },
      select: {
        autoRestockPlan: true,
        autoRestockPlanPrice: true,
        items: {
          select: {
            id: true,
            quantity: true,
            unitPriceSnapshot: true,
            product: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  const items = (cart?.items ?? []).map((item) => ({
    id: item.id,
    name: item.product.name,
    quantity: item.quantity,
    totalLabel: formatCurrency(item.quantity * item.unitPriceSnapshot, currencyCode),
  }));
  if (cart?.autoRestockPlan && cart.autoRestockPlanPrice != null) {
    items.unshift({
      id: `restocker-${cart.autoRestockPlan}`,
      name: `${getPlanMeta(cart.autoRestockPlan).name} Auto Restocker`,
      quantity: 1,
      totalLabel: formatCurrency(cart.autoRestockPlanPrice, currencyCode),
    });
  }
  const total =
    (cart?.items.reduce((sum, item) => sum + item.quantity * item.unitPriceSnapshot, 0) ?? 0) +
    (cart?.autoRestockPlanPrice ?? 0);

  return NextResponse.json({
    ok: true,
    items,
    totalLabel: formatCurrency(total, currencyCode),
  });
}
