import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { hasCompletedSecuritySetup, requireUser } from "@/lib/auth";
import {
  getBankNumberLookupHash,
  getCheckoutPinLookupHash,
  hashBankNumber,
  hashCheckoutPin,
  validateBankNumber,
  validateCheckoutPin,
} from "@/lib/pin";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

export async function POST(request: Request) {
  const user = await requireUser({ allowIncompleteSecurity: true });

  if (hasCompletedSecuritySetup(user)) {
    return NextResponse.redirect(
      new URL(user.shop ? "/dashboard" : "/onboarding/shop", request.url),
      303,
    );
  }

  const formData = await request.formData();
  const pin = String(formData.get("pin") ?? "").trim();
  const confirmPin = String(formData.get("confirmPin") ?? "").trim();
  const bankNumber = String(formData.get("bankNumber") ?? "").trim();
  const confirmBankNumber = String(formData.get("confirmBankNumber") ?? "").trim();
  const pinResult = validateCheckoutPin(pin);
  const bankNumberResult = validateBankNumber(bankNumber);

  if (!pinResult.success) {
    return NextResponse.redirect(
      new URL(`/security-setup?error=${encodeURIComponent(pinResult.error)}`, request.url),
      303,
    );
  }

  if (pinResult.pin !== confirmPin) {
    return NextResponse.redirect(
      new URL("/security-setup?error=PINs%20do%20not%20match", request.url),
      303,
    );
  }

  if (!bankNumberResult.success) {
    return NextResponse.redirect(
      new URL(`/security-setup?error=${encodeURIComponent(bankNumberResult.error)}`, request.url),
      303,
    );
  }

  if (bankNumberResult.bankNumber !== confirmBankNumber) {
    return NextResponse.redirect(
      new URL("/security-setup?error=Bank%20numbers%20do%20not%20match", request.url),
      303,
    );
  }

  const checkoutPinLookupHash = getCheckoutPinLookupHash(pinResult.pin);
  const bankNumberLookupHash = getBankNumberLookupHash(bankNumberResult.bankNumber);
  const existingPinOwner = await prisma.user.findFirst({
    where: {
      checkoutPinLookupHash,
      NOT: {
        id: user.id,
      },
    },
    select: {
      id: true,
    },
  });

  if (existingPinOwner) {
    return NextResponse.redirect(new URL("/security-setup?error=PIN%20taken", request.url), 303);
  }

  const existingBankNumberOwner = await prisma.user.findFirst({
    where: {
      bankNumberLookupHash,
      NOT: {
        id: user.id,
      },
    },
    select: {
      id: true,
    },
  });

  if (existingBankNumberOwner) {
    return NextResponse.redirect(
      new URL("/security-setup?error=Bank%20number%20taken", request.url),
      303,
    );
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        checkoutPinHash: hashCheckoutPin(pinResult.pin),
        checkoutPinLookupHash,
        bankNumberHash: hashBankNumber(bankNumberResult.bankNumber),
        bankNumberLookupHash,
        securitySetupCompleted: true,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.redirect(
        new URL("/security-setup?error=PIN%20or%20bank%20number%20taken", request.url),
        303,
      );
    }

    throw error;
  }

  return NextResponse.redirect(
    new URL(user.shop ? "/dashboard" : "/onboarding/shop", request.url),
    303,
  );
}
