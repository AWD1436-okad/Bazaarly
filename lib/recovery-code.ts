import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { RecoveryCodePurpose } from "@prisma/client";

import { sendProfitPlanetEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export const RECOVERY_CODE_TTL_MINUTES = 15;
export const RECOVERY_CODE_MAX_ATTEMPTS = 5;

function getRecoverySecret() {
  return process.env.RECOVERY_CODE_SECRET || process.env.SESSION_COOKIE_NAME || "profit-planet-dev-secret";
}

export function createRecoveryCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashRecoveryCode(email: string, purpose: RecoveryCodePurpose, code: string) {
  return createHash("sha256")
    .update(`${getRecoverySecret()}:${email.trim().toLowerCase()}:${purpose}:${code.trim()}`)
    .digest("hex");
}

export function compareRecoveryHash(expectedHash: string, actualHash: string) {
  const expected = Buffer.from(expectedHash, "hex");
  const actual = Buffer.from(actualHash, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function getRecoveryExpiry(now = new Date()) {
  return new Date(now.getTime() + RECOVERY_CODE_TTL_MINUTES * 60 * 1000);
}

export async function createAndSendRecoveryCode(input: {
  email: string;
  purpose: RecoveryCodePurpose;
  subject: string;
  intro: string;
}) {
  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, deletedAt: true },
  });

  if (!user || user.deletedAt) {
    return { created: false, sent: false };
  }

  const code = createRecoveryCode();
  const codeHash = hashRecoveryCode(email, input.purpose, code);
  const expiresAt = getRecoveryExpiry();

  await prisma.$transaction(async (tx) => {
    await tx.recoveryCode.updateMany({
      where: {
        userId: user.id,
        purpose: input.purpose,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    await tx.recoveryCode.create({
      data: {
        userId: user.id,
        email,
        purpose: input.purpose,
        codeHash,
        expiresAt,
      },
    });
  });

  const message = `${input.intro}\n\nYour reset code is: ${code}\n\nThis code expires in ${RECOVERY_CODE_TTL_MINUTES} minutes. If you did not ask for this, you can ignore this email.`;
  const emailResult = await sendProfitPlanetEmail({
    to: email,
    subject: input.subject,
    text: message,
  });

  return {
    created: true,
    sent: emailResult.sent,
    devCode: process.env.NODE_ENV !== "production" ? code : undefined,
  };
}

export async function findUsableRecoveryCode(input: {
  email: string;
  purpose: RecoveryCodePurpose;
  code: string;
}) {
  const email = input.email.trim().toLowerCase();
  const now = new Date();
  const candidates = await prisma.recoveryCode.findMany({
    where: {
      email,
      purpose: input.purpose,
      usedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      user: {
        select: {
          id: true,
          deletedAt: true,
        },
      },
    },
  });

  const providedHash = hashRecoveryCode(email, input.purpose, input.code);
  for (const candidate of candidates) {
    if (candidate.user.deletedAt || candidate.attemptCount >= RECOVERY_CODE_MAX_ATTEMPTS) {
      continue;
    }

    if (compareRecoveryHash(candidate.codeHash, providedHash)) {
      return candidate;
    }

    await prisma.recoveryCode.update({
      where: { id: candidate.id },
      data: { attemptCount: { increment: 1 } },
    });
  }

  return null;
}
