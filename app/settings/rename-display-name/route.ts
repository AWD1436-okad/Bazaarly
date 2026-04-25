import { NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSessionUser, hasCompletedSecuritySetup } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

const MIN_DISPLAY_NAME_LENGTH = 2;
const MAX_DISPLAY_NAME_LENGTH = 60;

function readFormString(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
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
  const displayName = readFormString(formData, "displayName");
  const password = readFormString(formData, "password");

  if (
    displayName.length < MIN_DISPLAY_NAME_LENGTH ||
    displayName.length > MAX_DISPLAY_NAME_LENGTH
  ) {
    return NextResponse.json(
      { ok: false, error: "Enter a display name between 2 and 60 characters" },
      { status: 400 },
    );
  }

  if (!password || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ ok: false, error: "Incorrect password" }, { status: 403 });
  }

  if (displayName === user.displayName) {
    return NextResponse.json(
      { ok: false, error: "Choose a different display name" },
      { status: 400 },
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { displayName },
    });

    await tx.notification.create({
      data: {
        userId: user.id,
        type: NotificationType.SYSTEM,
        message: `Your display name was changed to ${displayName}.`,
      },
    });
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/marketplace");
  revalidatePath("/notifications");
  revalidatePath("/orders");

  return NextResponse.json({
    ok: true,
    message: "Display name changed successfully",
    displayName,
  });
}
