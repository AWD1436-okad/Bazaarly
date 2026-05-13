import { NextResponse } from "next/server";

import {
  createPasswordResetThrottleKey,
  getAuthThrottleBlock,
  recordAuthThrottleAttempt,
} from "@/lib/auth-throttle";
import { createAndSendRecoveryCode } from "@/lib/recovery-code";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

function genericRedirect(request: Request, devCode?: string) {
  const url = new URL("/forgot-password", request.url);
  url.searchParams.set("sent", "1");
  if (process.env.NODE_ENV !== "production" && devCode) {
    url.searchParams.set("devCode", devCode);
  }
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? formData.get("usernameOrEmail") ?? "").trim().toLowerCase();

  if (!email) {
    return genericRedirect(request);
  }

  const throttleKey = createPasswordResetThrottleKey(request, email);
  const blockedUntil = await getAuthThrottleBlock("PASSWORD_RESET", throttleKey);
  if (blockedUntil) {
    const url = new URL("/forgot-password", request.url);
    url.searchParams.set("blocked", "1");
    return NextResponse.redirect(url, 303);
  }

  await recordAuthThrottleAttempt("PASSWORD_RESET", throttleKey);

  const result = await createAndSendRecoveryCode({
    email,
    purpose: "PASSWORD_RESET",
    subject: "Profit Planet password reset code",
    intro: "Use this code to create a new Profit Planet password.",
  });

  return genericRedirect(request, result.devCode);
}
