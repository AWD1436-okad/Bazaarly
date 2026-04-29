import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { hasCompletedSecuritySetup, requireUser } from "@/lib/auth";
import {
  getBankNumberLookupHash,
  getCheckoutPinLookupHash,
  hashBankNumber,
  hashCheckoutPin,
  encryptBankNumber,
  validateBankNumber,
  validateCheckoutPin,
} from "@/lib/pin";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

function getPostSecurityRedirectPath(user: Awaited<ReturnType<typeof requireUser>>) {
  if (user.shop) {
    return "/dashboard";
  }

  return "/onboarding/shop";
}

function getSecuritySetupRevealPath() {
  return "/security-setup?reveal=1";
}

function redirectWithError(request: Request, message: string) {
  const url = new URL("/security-setup", request.url);
  url.searchParams.set("error", message);

  return NextResponse.redirect(
    url,
    303,
  );
}

export async function POST(request: Request) {
  const user = await requireUser({ allowIncompleteSecurity: true });

  if (hasCompletedSecuritySetup(user)) {
    return NextResponse.redirect(
      new URL(getPostSecurityRedirectPath(user), request.url),
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
    return redirectWithError(request, pinResult.error);
  }

  if (pinResult.pin !== confirmPin) {
    return redirectWithError(request, "PINs do not match");
  }

  if (!bankNumberResult.success) {
    return redirectWithError(request, bankNumberResult.error);
  }

  if (bankNumberResult.bankNumber !== confirmBankNumber) {
    return redirectWithError(request, "Bank numbers do not match");
  }

  const checkoutPinLookupHash = getCheckoutPinLookupHash(pinResult.pin);
  const bankNumberLookupHash = getBankNumberLookupHash(bankNumberResult.bankNumber);
  const existingPinOwner = await prisma.user.findFirst({
    where: {
      checkoutPinLookupHash,
      NOT: { id: user.id },
    },
    select: { id: true },
  });

  if (existingPinOwner) {
    return redirectWithError(request, "PIN taken");
  }

  const existingBankNumberOwner = await prisma.user.findFirst({
    where: {
      bankNumberLookupHash,
      NOT: { id: user.id },
    },
    select: { id: true },
  });

  if (existingBankNumberOwner) {
    return redirectWithError(request, "Bank number taken");
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        checkoutPinHash: hashCheckoutPin(pinResult.pin),
        checkoutPinLookupHash,
        bankNumberHash: hashBankNumber(bankNumberResult.bankNumber),
        bankNumberLookupHash,
        bankNumberEncrypted: encryptBankNumber(bankNumberResult.bankNumber),
        bankNumberLast4: bankNumberResult.bankNumber.slice(-4),
        securitySetupCompleted: true,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return redirectWithError(request, "PIN or bank number taken");
    }

    throw error;
  }

  return NextResponse.redirect(
    new URL(getSecuritySetupRevealPath(), request.url),
    303,
  );
}
