import { NextResponse } from "next/server";

import {
  createRegisterThrottleKey,
  getAuthThrottleBlock,
  recordAuthThrottleAttempt,
} from "@/lib/auth-throttle";
import {
  createSessionToken,
  getSessionCookieName,
  getSessionCookieOptions,
} from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

export async function POST(request: Request) {
  const formData = await request.formData();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const intent = String(formData.get("intent") ?? "shop") === "branch" ? "branch" : "shop";
  const throttleKey = createRegisterThrottleKey(request);

  if (!displayName || !username || !email || password.length < 8) {
    return NextResponse.redirect(
      new URL("/login?error=Enter%20all%20fields%20and%20use%20an%208+%20character%20password", request.url),
      303,
    );
  }

  const blockedUntil = await getAuthThrottleBlock("REGISTER", throttleKey);

  if (blockedUntil) {
    return NextResponse.redirect(
      new URL("/login?error=Too%20many%20sign-up%20attempts.%20Please%20wait%20a%20few%20minutes", request.url),
      303,
    );
  }

  await recordAuthThrottleAttempt("REGISTER", throttleKey);

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
  });

  if (existing) {
    return NextResponse.redirect(
      new URL("/login?error=That%20username%20or%20email%20is%20already%20in%20use", request.url),
      303,
    );
  }

  const user = await prisma.user.create({
    data: {
      displayName,
      username,
      email,
      passwordHash: hashPassword(password),
      balance: 0,
    },
  });

  const response = NextResponse.redirect(
    new URL(intent === "branch" ? "/security-setup?intent=branch" : "/security-setup", request.url),
    303,
  );
  const sessionToken = await createSessionToken(user.id);
  response.cookies.set(getSessionCookieName(), sessionToken, getSessionCookieOptions());

  return response;
}
