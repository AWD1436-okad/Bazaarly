import { NextResponse } from "next/server";

import { clearSession, getSessionCookieName } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { hashPasswordResetToken, isPasswordStrongEnough } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

function redirectWithError(request: Request, token: string, error: string) {
  const url = new URL("/reset-password", request.url);
  if (token) {
    url.searchParams.set("token", token);
  }
  url.searchParams.set("error", error);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!token) {
    return redirectWithError(request, "", "This reset link is missing or invalid.");
  }

  if (!isPasswordStrongEnough(password)) {
    return redirectWithError(request, token, "Use an 8+ character password.");
  }

  if (password !== confirmPassword) {
    return redirectWithError(request, token, "Passwords do not match.");
  }

  const tokenHash = hashPasswordResetToken(token);
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      usedAt: true,
      user: {
        select: {
          deletedAt: true,
        },
      },
    },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date() || resetToken.user.deletedAt) {
    return redirectWithError(request, "", "This reset link is invalid, expired, or already used.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: resetToken.userId },
      data: {
        passwordHash: hashPassword(password),
      },
    });

    await tx.passwordResetToken.update({
      where: { id: resetToken.id },
      data: {
        usedAt: new Date(),
      },
    });

    await tx.passwordResetToken.updateMany({
      where: {
        userId: resetToken.userId,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    await tx.session.deleteMany({
      where: {
        userId: resetToken.userId,
      },
    });
  });

  await clearSession();
  const response = NextResponse.redirect(new URL("/reset-password?success=1", request.url), 303);
  response.cookies.delete(getSessionCookieName());
  return response;
}
