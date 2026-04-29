import { NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { BRANCH_SETUP_COST_CENTS, validateSuburbLocation } from "@/lib/branching";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

export async function POST(request: Request) {
  const user = await requireUser();
  const formData = await request.formData();
  const action = String(formData.get("action") ?? "");

  if (!user.shop) {
    return NextResponse.redirect(new URL("/settings?error=Create%20a%20shop%20first", request.url), 303);
  }

  if (action === "disable") {
    await prisma.shop.update({
      where: { id: user.shop.id },
      data: {
        availableToBranch: false,
      },
    });
    revalidatePath("/settings");
    return NextResponse.redirect(new URL("/settings?branch=disabled", request.url), 303);
  }

  const locationResult = validateSuburbLocation(String(formData.get("location") ?? ""));
  if (!locationResult.ok) {
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(locationResult.error)}`, request.url),
      303,
    );
  }

  if (user.balance < BRANCH_SETUP_COST_CENTS) {
    return NextResponse.redirect(new URL("/settings?error=Balance%20too%20low", request.url), 303);
  }

  await prisma.$transaction(async (tx) => {
    const freshUser = await tx.user.findUnique({
      where: { id: user.id },
      select: { balance: true },
    });

    if (!freshUser || freshUser.balance < BRANCH_SETUP_COST_CENTS) {
      throw new Error("Balance too low");
    }

    await tx.user.update({
      where: { id: user.id },
      data: {
        balance: { decrement: BRANCH_SETUP_COST_CENTS },
      },
    });

    await tx.shop.update({
      where: { id: user.shop!.id },
      data: {
        availableToBranch: true,
        branchLocation: locationResult.location,
      },
    });

    await tx.notification.create({
      data: {
        userId: user.id,
        type: NotificationType.SYSTEM,
        message: `Your shop is now available for branch requests in ${locationResult.location}.`,
      },
    });
  });

  revalidatePath("/settings");
  revalidatePath("/branch/join");
  return NextResponse.redirect(new URL("/settings?branch=enabled", request.url), 303);
}
