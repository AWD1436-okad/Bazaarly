import { NotificationType } from "@prisma/client";
import { NextResponse } from "next/server";

import { hashCheckoutPin, validateCheckoutPin, getCheckoutPinLookupHash } from "@/lib/pin";
import { prisma } from "@/lib/prisma";
import { findUsableRecoveryCode } from "@/lib/recovery-code";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

function redirectWithError(request: Request, email: string, error: string) {
  const url = new URL("/forgot-pin", request.url);
  if (email) url.searchParams.set("email", email);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const code = String(formData.get("code") ?? "").trim();
  const pinResult = validateCheckoutPin(String(formData.get("newPin") ?? ""));
  const confirmPin = String(formData.get("confirmPin") ?? "").trim();

  if (!email || !code) {
    return redirectWithError(request, email, "Enter your email and reset code.");
  }
  if (!pinResult.success) {
    return redirectWithError(request, email, pinResult.error);
  }
  if (pinResult.pin !== confirmPin) {
    return redirectWithError(request, email, "PINs do not match.");
  }

  const resetCode = await findUsableRecoveryCode({
    email,
    purpose: "PIN_RESET",
    code,
  });

  if (!resetCode) {
    return redirectWithError(request, email, "Code expired or does not match. Ask for a new one.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: resetCode.userId },
      data: {
        checkoutPinHash: hashCheckoutPin(pinResult.pin),
        checkoutPinLookupHash: getCheckoutPinLookupHash(pinResult.pin),
      },
    });

    await tx.recoveryCode.update({
      where: { id: resetCode.id },
      data: { usedAt: new Date() },
    });

    await tx.recoveryCode.updateMany({
      where: {
        userId: resetCode.userId,
        purpose: "PIN_RESET",
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    await tx.notification.create({
      data: {
        userId: resetCode.userId,
        type: NotificationType.SYSTEM,
        message: "Your bank PIN was reset securely.",
      },
    });
  });

  return NextResponse.redirect(new URL("/forgot-pin?success=1", request.url), 303);
}
