import { NextResponse } from "next/server";

import {
  createPasswordResetThrottleKey,
  getAuthThrottleBlock,
  recordAuthThrottleAttempt,
} from "@/lib/auth-throttle";
import {
  createPasswordResetToken,
  getPasswordResetExpiry,
  hashPasswordResetToken,
} from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

function genericRedirect(request: Request, devResetUrl?: string) {
  const url = new URL("/forgot-password", request.url);
  url.searchParams.set("sent", "1");
  if (process.env.NODE_ENV !== "production" && devResetUrl) {
    url.searchParams.set("devResetUrl", devResetUrl);
  }
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const usernameOrEmail = String(formData.get("usernameOrEmail") ?? "").trim().toLowerCase();

  if (!usernameOrEmail) {
    return genericRedirect(request);
  }

  const throttleKey = createPasswordResetThrottleKey(request, usernameOrEmail);
  const blockedUntil = await getAuthThrottleBlock("PASSWORD_RESET", throttleKey);
  if (blockedUntil) {
    const url = new URL("/forgot-password", request.url);
    url.searchParams.set("blocked", "1");
    return NextResponse.redirect(url, 303);
  }

  await recordAuthThrottleAttempt("PASSWORD_RESET", throttleKey);

  const user = await prisma.user.findFirst({
    where: {
      deletedAt: null,
      OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    },
    select: { id: true },
  });

  if (!user) {
    return genericRedirect(request);
  }

  const token = createPasswordResetToken();
  const tokenHash = hashPasswordResetToken(token);
  const expiresAt = getPasswordResetExpiry();

  await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: {
        usedAt: new Date(),
      },
    });

    await tx.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });
  });

  // No email provider is configured yet. Production never exposes reset tokens.
  const devResetUrl = `/reset-password?token=${encodeURIComponent(token)}`;
  return genericRedirect(request, devResetUrl);
}
