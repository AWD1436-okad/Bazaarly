import { NotificationType } from "@prisma/client";
import { NextResponse } from "next/server";

import {
  createPinResetThrottleKey,
  getAuthThrottleBlock,
  recordAuthThrottleAttempt,
} from "@/lib/auth-throttle";
import { getSessionUser, hasCompletedSecuritySetup } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import {
  getCheckoutPinLookupHash,
  hashCheckoutPin,
  validateCheckoutPin,
} from "@/lib/pin";
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

  const throttleKey = createPinResetThrottleKey(request, user.id);
  const blockedUntil = await getAuthThrottleBlock("PIN_RESET", throttleKey);
  if (blockedUntil) {
    return NextResponse.json(
      { ok: false, error: "Too many PIN reset attempts. Please wait a few minutes." },
      { status: 429 },
    );
  }

  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const pinResult = validateCheckoutPin(String(formData.get("newPin") ?? ""));
  const confirmPin = String(formData.get("confirmPin") ?? "").trim();

  if (!pinResult.success) {
    await recordAuthThrottleAttempt("PIN_RESET", throttleKey);
    return NextResponse.json({ ok: false, error: pinResult.error }, { status: 400 });
  }

  if (pinResult.pin !== confirmPin) {
    await recordAuthThrottleAttempt("PIN_RESET", throttleKey);
    return NextResponse.json({ ok: false, error: "PINs do not match" }, { status: 400 });
  }

  const freshUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (!freshUser || !verifyPassword(password, freshUser.passwordHash)) {
    await recordAuthThrottleAttempt("PIN_RESET", throttleKey);
    return NextResponse.json({ ok: false, error: "Incorrect password" }, { status: 400 });
  }

  const checkoutPinLookupHash = getCheckoutPinLookupHash(pinResult.pin);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      checkoutPinHash: hashCheckoutPin(pinResult.pin),
      checkoutPinLookupHash,
    },
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      type: NotificationType.SYSTEM,
      message: "Your bank PIN was reset securely.",
    },
  });

  return NextResponse.json({ ok: true, message: "Bank PIN reset securely" });
}
