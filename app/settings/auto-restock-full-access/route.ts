import { AutoRestockSubscriptionStatus, NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSessionUser, hasCompletedSecuritySetup } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { verifyCheckoutPin } from "@/lib/pin";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Login required" }, { status: 401 });
  }
  if (!hasCompletedSecuritySetup(user)) {
    return NextResponse.json({ ok: false, error: "Complete security setup first" }, { status: 403 });
  }

  const formData = await request.formData();
  const enabled = String(formData.get("enabled") ?? "false").toLowerCase() === "true";

  const subscription = await prisma.autoRestockSubscription.findFirst({
    where: {
      userId: user.id,
      status: AutoRestockSubscriptionStatus.ACTIVE,
    },
    select: { id: true, plan: true },
  });

  if (!subscription) {
    return NextResponse.json({ ok: false, error: "No active Auto Restock subscription" }, { status: 400 });
  }

  if (enabled) {
    const password = String(formData.get("password") ?? "");
    const checkoutPin = String(formData.get("checkoutPin") ?? "");
    const authUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        passwordHash: true,
        checkoutPinHash: true,
      },
    });

    if (
      !authUser ||
      !verifyPassword(password, authUser.passwordHash) ||
      !verifyCheckoutPin(checkoutPin, authUser.checkoutPinHash)
    ) {
      return NextResponse.json({ ok: false, error: "Incorrect password or PIN" }, { status: 400 });
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.autoRestockSubscription.update({
      where: { id: subscription.id },
      data: {
        fullAccessEnabled: enabled,
      },
    });

    await tx.notification.create({
      data: {
        userId: user.id,
        type: NotificationType.SYSTEM,
        message: enabled
          ? "Auto Restock Full Access enabled. Eligible restocks can be bought automatically."
          : "Auto Restock Full Access turned off. Future eligible restocks will ask first.",
      },
    });
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/notifications");

  return NextResponse.json({
    ok: true,
    message: enabled ? "Full Access enabled" : "Full Access turned off",
  });
}
