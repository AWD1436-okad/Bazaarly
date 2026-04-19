import { NextResponse } from "next/server";

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

  if (!displayName || !username || !email || password.length < 8) {
    return NextResponse.redirect(
      new URL("/login?error=Enter%20all%20fields%20and%20use%20an%208+%20character%20password", request.url),
      303,
    );
  }

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

  const response = NextResponse.redirect(new URL("/onboarding/shop", request.url), 303);
  const sessionToken = await createSessionToken(user.id);
  response.cookies.set(getSessionCookieName(), sessionToken, getSessionCookieOptions());

  return response;
}
