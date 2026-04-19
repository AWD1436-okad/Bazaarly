import { createHash } from "node:crypto";

import { prisma } from "@/lib/prisma";

type AuthThrottleAction = "LOGIN" | "REGISTER";

type AuthThrottlePolicy = {
  maxAttempts: number;
  windowMs: number;
  blockMs: number;
};

const AUTH_THROTTLE_POLICIES: Record<AuthThrottleAction, AuthThrottlePolicy> = {
  LOGIN: {
    maxAttempts: 5,
    windowMs: 10 * 60 * 1000,
    blockMs: 10 * 60 * 1000,
  },
  REGISTER: {
    maxAttempts: 3,
    windowMs: 15 * 60 * 1000,
    blockMs: 15 * 60 * 1000,
  },
};

function hashThrottleKey(rawKey: string) {
  return createHash("sha256").update(rawKey).digest("hex");
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  return "unknown-ip";
}

function getRequestFingerprint(request: Request) {
  const userAgent = request.headers.get("user-agent")?.trim().slice(0, 160) || "unknown-agent";
  return `${getClientIp(request)}|${userAgent}`;
}

function buildThrottleHash(action: AuthThrottleAction, scope: string) {
  return hashThrottleKey(`${action}:${scope}`);
}

export function createLoginThrottleKey(request: Request, usernameOrEmail: string) {
  return buildThrottleHash("LOGIN", `${getRequestFingerprint(request)}|${usernameOrEmail}`);
}

export function createRegisterThrottleKey(request: Request) {
  return buildThrottleHash("REGISTER", getRequestFingerprint(request));
}

export async function getAuthThrottleBlock(
  action: AuthThrottleAction,
  keyHash: string,
) {
  const record = await prisma.authThrottle.findUnique({
    where: {
      action_keyHash: {
        action,
        keyHash,
      },
    },
  });

  if (!record || !record.blockedUntil || record.blockedUntil <= new Date()) {
    return null;
  }

  return record.blockedUntil;
}

export async function recordAuthThrottleAttempt(
  action: AuthThrottleAction,
  keyHash: string,
) {
  const policy = AUTH_THROTTLE_POLICIES[action];
  const now = new Date();
  const record = await prisma.authThrottle.findUnique({
    where: {
      action_keyHash: {
        action,
        keyHash,
      },
    },
  });

  if (!record) {
    const blockedUntil =
      policy.maxAttempts <= 1 ? new Date(now.getTime() + policy.blockMs) : null;

    await prisma.authThrottle.create({
      data: {
        action,
        keyHash,
        attemptCount: 1,
        windowStartedAt: now,
        blockedUntil,
      },
    });

    return blockedUntil;
  }

  const windowExpired = record.windowStartedAt.getTime() + policy.windowMs <= now.getTime();
  const nextAttemptCount = windowExpired ? 1 : record.attemptCount + 1;
  const blockedUntil =
    nextAttemptCount >= policy.maxAttempts
      ? new Date(now.getTime() + policy.blockMs)
      : null;

  await prisma.authThrottle.update({
    where: {
      action_keyHash: {
        action,
        keyHash,
      },
    },
    data: {
      attemptCount: nextAttemptCount,
      windowStartedAt: windowExpired ? now : record.windowStartedAt,
      blockedUntil,
    },
  });

  return blockedUntil;
}

export async function clearAuthThrottle(
  action: AuthThrottleAction,
  keyHash: string,
) {
  await prisma.authThrottle.deleteMany({
    where: {
      action,
      keyHash,
    },
  });
}
