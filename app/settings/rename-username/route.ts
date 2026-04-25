import { NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSessionUser, hasCompletedSecuritySetup } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

const USERNAME_PATTERN = /^[a-z0-9_-]{3,24}$/;

function readFormString(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Login required" }, { status: 401 });
  }
  if (!hasCompletedSecuritySetup(user)) {
    return NextResponse.json({ ok: false, error: "Complete security setup first" }, { status: 403 });
  }

  const formData = await request.formData();
  const username = readFormString(formData, "username").toLowerCase();
  const password = readFormString(formData, "password");

  if (!USERNAME_PATTERN.test(username)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Use 3-24 letters, numbers, underscores, or hyphens",
      },
      { status: 400 },
    );
  }

  if (!password || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ ok: false, error: "Incorrect password" }, { status: 403 });
  }

  if (username === user.username.toLowerCase()) {
    return NextResponse.json({ ok: false, error: "Choose a different username" }, { status: 400 });
  }

  const duplicateUser = await prisma.user.findFirst({
    where: {
      id: { not: user.id },
      username: {
        equals: username,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });

  if (duplicateUser) {
    return NextResponse.json({ ok: false, error: "Username is already taken" }, { status: 409 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { username },
    });

    await tx.notification.create({
      data: {
        userId: user.id,
        type: NotificationType.SYSTEM,
        message: `Your username was changed to @${username}.`,
      },
    });
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/marketplace");
  revalidatePath("/notifications");

  return NextResponse.json({
    ok: true,
    message: "Username changed successfully",
    username,
  });
}
