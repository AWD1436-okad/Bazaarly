import { NextResponse } from "next/server";

import { getSessionUser, hasCompletedSecuritySetup } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { decryptBankNumber, maskBankNumber, verifyCheckoutPin } from "@/lib/pin";
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
  const password = String(formData.get("password") ?? "");
  const checkoutPin = String(formData.get("checkoutPin") ?? "").trim();

  const authUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      passwordHash: true,
      checkoutPinHash: true,
      bankNumberEncrypted: true,
    },
  });

  if (
    !authUser ||
    !verifyPassword(password, authUser.passwordHash) ||
    !verifyCheckoutPin(checkoutPin, authUser.checkoutPinHash)
  ) {
    return NextResponse.json({ ok: false, error: "Incorrect password or PIN" }, { status: 403 });
  }

  const bankNumber = decryptBankNumber(authUser.bankNumberEncrypted);
  if (!bankNumber) {
    return NextResponse.json(
      {
        ok: false,
        error: "Bank number recovery is unavailable for this account.",
      },
      { status: 409 },
    );
  }

  return NextResponse.json({
    ok: true,
    bankNumber,
    maskedBankNumber: maskBankNumber(bankNumber),
  });
}
