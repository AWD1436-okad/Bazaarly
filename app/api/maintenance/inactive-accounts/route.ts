import { NotificationType } from "@prisma/client";
import { NextResponse } from "next/server";

import { sendProfitPlanetEmail } from "@/lib/email";
import { verifyMaintenanceRequest } from "@/lib/maintenance-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(days: number, now = new Date()) {
  return new Date(now.getTime() - days * DAY_MS);
}

function keepDate(lastActiveAt: Date) {
  return new Date(lastActiveAt.getTime() + 30 * DAY_MS).toLocaleDateString("en-AU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

async function warnUser(input: {
  userId: string;
  email: string;
  lastActiveAt: Date;
  field: "inactiveWarning25At" | "inactiveWarning28At" | "inactiveFinalWarningAt";
  message: string;
}) {
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: input.userId },
      data: { [input.field]: now },
    });
    await tx.notification.create({
      data: {
        userId: input.userId,
        type: NotificationType.SYSTEM,
        message: input.message,
        createdAt: now,
      },
    });
  });

  await sendProfitPlanetEmail({
    to: input.email,
    subject: "Profit Planet inactive account warning",
    text: `${input.message}\n\nLog in to keep your account active.`,
  }).catch(() => null);
}

async function runMaintenance(request: Request) {
  const unauthorized = verifyMaintenanceRequest(request);
  if (unauthorized) return unauthorized;

  const now = new Date();
  let warnings25 = 0;
  let warnings28 = 0;
  let finalWarnings = 0;
  let disabled = 0;

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      lastActiveAt: { lte: daysAgo(25, now) },
    },
    select: {
      id: true,
      email: true,
      lastActiveAt: true,
      inactiveWarning25At: true,
      inactiveWarning28At: true,
      inactiveFinalWarningAt: true,
    },
    take: 500,
  });

  for (const user of users) {
    const keepBefore = keepDate(user.lastActiveAt);
    const baseMessage = `Your Profit Planet account has been inactive. Log in before ${keepBefore} to keep it.`;

    if (user.lastActiveAt <= daysAgo(30, now)) {
      await prisma.$transaction(async (tx) => {
        const fresh = await tx.user.findUnique({
          where: { id: user.id },
          select: { lastActiveAt: true, deletedAt: true },
        });
        if (!fresh || fresh.deletedAt || fresh.lastActiveAt > daysAgo(30, now)) return;

        await tx.user.update({
          where: { id: user.id },
          data: {
            deletedAt: now,
            disabledReason: "inactive_30_days",
            inactiveFinalWarningAt: user.inactiveFinalWarningAt ?? now,
          },
        });
        await tx.session.deleteMany({ where: { userId: user.id } });
      });
      disabled += 1;
      continue;
    }

    if (user.lastActiveAt <= daysAgo(29, now) && !user.inactiveFinalWarningAt) {
      await warnUser({
        userId: user.id,
        email: user.email,
        lastActiveAt: user.lastActiveAt,
        field: "inactiveFinalWarningAt",
        message: `${baseMessage} This is your final warning.`,
      });
      finalWarnings += 1;
      continue;
    }

    if (user.lastActiveAt <= daysAgo(28, now) && !user.inactiveWarning28At) {
      await warnUser({
        userId: user.id,
        email: user.email,
        lastActiveAt: user.lastActiveAt,
        field: "inactiveWarning28At",
        message: baseMessage,
      });
      warnings28 += 1;
      continue;
    }

    if (!user.inactiveWarning25At) {
      await warnUser({
        userId: user.id,
        email: user.email,
        lastActiveAt: user.lastActiveAt,
        field: "inactiveWarning25At",
        message: baseMessage,
      });
      warnings25 += 1;
    }
  }

  return NextResponse.json({ ok: true, warnings25, warnings28, finalWarnings, disabled });
}

export async function GET(request: Request) {
  return runMaintenance(request);
}

export async function POST(request: Request) {
  return runMaintenance(request);
}
