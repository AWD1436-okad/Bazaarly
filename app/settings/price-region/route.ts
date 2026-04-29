import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSessionUser, hasCompletedSecuritySetup } from "@/lib/auth";
import {
  getPriceProfileMetadata,
  normalizeCurrencyCode,
  SUPPORTED_CURRENCY_CODES,
  updateUserCurrencyPreference,
} from "@/lib/price-profiles";

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
  const requestedCurrencyCode = String(formData.get("currencyCode") ?? "").trim().toUpperCase();

  if (!SUPPORTED_CURRENCY_CODES.includes(requestedCurrencyCode as never)) {
    return NextResponse.json({ ok: false, error: "Choose a supported currency" }, { status: 400 });
  }

  const currencyCode = await updateUserCurrencyPreference(user.id, requestedCurrencyCode);
  const profile = getPriceProfileMetadata(currencyCode);

  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/supplier");
  revalidatePath("/marketplace");
  revalidatePath("/cart");
  revalidatePath("/checkout");

  return NextResponse.json({
    ok: true,
    currencyCode: normalizeCurrencyCode(currencyCode),
    message: `Display currency changed to ${profile.label}`,
  });
}
