import { NextResponse } from "next/server";

import {
  clearAuthThrottle,
  createLoginThrottleKey,
  getAuthThrottleBlock,
  recordAuthThrottleAttempt,
} from "@/lib/auth-throttle";
import {
  createSessionToken,
  getSessionCookieName,
  getSessionCookieOptions,
  hasCompletedSecuritySetup,
} from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

export async function POST(request: Request) {
  const formData = await request.formData();
  const usernameOrEmail = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const intent = String(formData.get("intent") ?? "shop") === "branch" ? "branch" : "shop";

  if (!usernameOrEmail || !password) {
    return NextResponse.redirect(
      new URL("/login?error=Enter%20your%20username%20and%20password", request.url),
      303,
    );
  }

  const throttleKey = createLoginThrottleKey(request, usernameOrEmail);
  const blockedUntil = await getAuthThrottleBlock("LOGIN", throttleKey);

  if (blockedUntil) {
    return NextResponse.redirect(
      new URL("/login?error=Too%20many%20login%20attempts.%20Please%20wait%20a%20few%20minutes", request.url),
      303,
    );
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    },
    include: { shop: true },
  });

  if (!user || user.deletedAt || !verifyPassword(password, user.passwordHash)) {
    const nextBlockedUntil = await recordAuthThrottleAttempt("LOGIN", throttleKey);
    return NextResponse.redirect(
      new URL(
        nextBlockedUntil
          ? "/login?error=Too%20many%20login%20attempts.%20Please%20wait%20a%20few%20minutes"
          : "/login?error=Incorrect%20username%20or%20password",
        request.url,
      ),
      303,
    );
  }

  await clearAuthThrottle("LOGIN", throttleKey);

  const response = NextResponse.redirect(
    new URL(
      !hasCompletedSecuritySetup(user)
        ? "/security-setup"
        : user.shop
          ? "/dashboard"
          : intent === "branch"
            ? "/branch/join"
            : "/onboarding/shop",
      request.url,
    ),
    303,
  );
  const sessionToken = await createSessionToken(user.id);

  response.cookies.set(getSessionCookieName(), sessionToken, getSessionCookieOptions());

  return response;
}
