import { NextResponse } from "next/server";

import {
  createPinRecoveryThrottleKey,
  getAuthThrottleBlock,
  recordAuthThrottleAttempt,
} from "@/lib/auth-throttle";
import { createAndSendRecoveryCode } from "@/lib/recovery-code";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

function redirectBack(request: Request, email: string, devCode?: string) {
  const url = new URL("/forgot-pin", request.url);
  url.searchParams.set("sent", "1");
  if (email) url.searchParams.set("email", email);
  if (process.env.NODE_ENV !== "production" && devCode) {
    url.searchParams.set("devCode", devCode);
  }
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) {
    return redirectBack(request, "");
  }

  const throttleKey = createPinRecoveryThrottleKey(request, email);
  const blockedUntil = await getAuthThrottleBlock("PIN_RESET", throttleKey);
  if (blockedUntil) {
    const url = new URL("/forgot-pin", request.url);
    url.searchParams.set("error", "Too many attempts. Please wait a few minutes.");
    return NextResponse.redirect(url, 303);
  }

  await recordAuthThrottleAttempt("PIN_RESET", throttleKey);
  const result = await createAndSendRecoveryCode({
    email,
    purpose: "PIN_RESET",
    subject: "Profit Planet PIN reset code",
    intro: "Use this code to create a new Profit Planet bank PIN.",
  });

  return redirectBack(request, email, result.devCode);
}
