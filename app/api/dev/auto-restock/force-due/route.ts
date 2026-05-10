import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getRestockCycleMs } from "@/lib/auto-restock";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const user = await getSessionUser();
  if (!user?.shop) {
    return NextResponse.json({ ok: false, error: "Login and shop required" }, { status: 401 });
  }

  const formData = await request.formData();
  const makeSoldOut = String(formData.get("makeSoldOut") ?? "") === "1";
  const subscription = await prisma.autoRestockSubscription.findUnique({
    where: { userId: user.id },
  });

  if (!subscription || subscription.status !== "ACTIVE") {
    return NextResponse.json({ ok: false, error: "No active restocker subscription" }, { status: 400 });
  }

  const dueAt = new Date(Date.now() - getRestockCycleMs(subscription.plan, subscription.restockIntervalMinutes) - 1000);

  if (makeSoldOut) {
    const listing = await prisma.listing.findFirst({
      where: {
        shopId: user.shop.id,
        isPaused: false,
      },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });

    if (listing) {
      await prisma.listing.update({
        where: { id: listing.id },
        data: {
          quantity: 0,
          active: true,
          soldOutAt: new Date(),
        },
      });
    }
  }

  await prisma.autoRestockSubscription.update({
    where: { id: subscription.id },
    data: { lastRestockAt: dueAt },
  });

  return NextResponse.json({ ok: true, dueAt: dueAt.toISOString() });
}
