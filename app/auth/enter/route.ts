import { NextResponse } from "next/server";

import {
  clearAuthThrottle,
  createLoginThrottleKey,
  createRegisterThrottleKey,
  getAuthThrottleBlock,
  recordAuthThrottleAttempt,
} from "@/lib/auth-throttle";
import {
  createSessionToken,
  getSessionCookieName,
  getSessionCookieOptions,
  hasCompletedSecuritySetup,
} from "@/lib/auth";
import { createNewPlayerFromShopEntry, validateShopEntry } from "@/lib/new-player";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

function redirectWithError(request: Request, message: string) {
  return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, request.url), 303);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const entry = validateShopEntry(
    String(formData.get("shopName") ?? ""),
    String(formData.get("password") ?? ""),
  );

  if (!entry.success) {
    return redirectWithError(request, entry.error);
  }

  const loginThrottleKey = createLoginThrottleKey(request, entry.shopName.toLowerCase());
  if (await getAuthThrottleBlock("LOGIN", loginThrottleKey)) {
    return redirectWithError(request, "Too many attempts. Please wait a few minutes and try again.");
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      shop: {
        is: {
          name: {
            equals: entry.shopName,
            mode: "insensitive",
          },
        },
      },
    },
    include: { shop: true },
  });

  if (existingUser) {
    if (existingUser.deletedAt || !verifyPassword(entry.password, existingUser.passwordHash)) {
      const blockedUntil = await recordAuthThrottleAttempt("LOGIN", loginThrottleKey);
      return redirectWithError(
        request,
        blockedUntil ? "Too many attempts. Please wait a few minutes and try again." : "Incorrect shop name or password.",
      );
    }

    await clearAuthThrottle("LOGIN", loginThrottleKey);
    const response = NextResponse.redirect(
      new URL(hasCompletedSecuritySetup(existingUser) ? "/dashboard" : "/security-setup", request.url),
      303,
    );
    response.cookies.set(getSessionCookieName(), await createSessionToken(existingUser.id), getSessionCookieOptions());
    return response;
  }

  const registerThrottleKey = createRegisterThrottleKey(request);
  if (await getAuthThrottleBlock("REGISTER", registerThrottleKey)) {
    return redirectWithError(request, "Too many new shops were started here. Please wait a few minutes.");
  }

  await recordAuthThrottleAttempt("REGISTER", registerThrottleKey);
  try {
    const { user } = await createNewPlayerFromShopEntry(entry.shopName, entry.password);
    const response = NextResponse.redirect(new URL("/security-setup", request.url), 303);
    response.cookies.set(getSessionCookieName(), await createSessionToken(user.id), getSessionCookieOptions());
    return response;
  } catch (error) {
    return redirectWithError(
      request,
      error instanceof Error ? error.message : "We could not start your shop. Please try again.",
    );
  }
}
