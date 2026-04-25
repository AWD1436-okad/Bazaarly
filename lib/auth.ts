import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME ?? "bazaarly_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;

function hashSessionToken(sessionToken: string) {
  return createHash("sha256").update(sessionToken).digest("hex");
}

const getSessionByTokenHash = cache(async (tokenHash: string) =>
  prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        include: {
          shop: true,
        },
      },
    },
  }),
);

export async function getSessionUser() {
  const sessionValue = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  if (!sessionValue) {
    return null;
  }

  const session = await getSessionByTokenHash(hashSessionToken(sessionValue));

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date() || session.user.deletedAt) {
    await prisma.session.deleteMany({
      where: {
        tokenHash: session.tokenHash,
      },
    });
    return null;
  }

  return session.user;
}

type RequireUserOptions = {
  allowMissingPin?: boolean;
  allowIncompleteSecurity?: boolean;
};

export function hasCompletedSecuritySetup(user: {
  checkoutPinHash?: string | null;
  bankNumberHash?: string | null;
  securitySetupCompleted?: boolean | null;
}) {
  return Boolean(user.securitySetupCompleted && user.checkoutPinHash && user.bankNumberHash);
}

export async function requireUser(options: RequireUserOptions = {}) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (
    !options.allowMissingPin &&
    !options.allowIncompleteSecurity &&
    !hasCompletedSecuritySetup(user)
  ) {
    redirect("/security-setup" as never);
  }

  return user;
}

export async function setSession(userId: string) {
  const sessionToken = await createSessionToken(userId);
  (await cookies()).set(SESSION_COOKIE_NAME, sessionToken, getSessionCookieOptions());
}

export async function clearSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    await revokeSessionToken(sessionToken);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export function getPostLoginRedirect(hasShop: boolean, hasSecuritySetup: boolean) {
  if (!hasSecuritySetup) {
    return "/security-setup";
  }

  return hasShop ? "/dashboard" : "/onboarding/shop";
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
    expires: new Date(Date.now() + SESSION_MAX_AGE_MS),
  };
}

export async function createSessionToken(userId: string) {
  const sessionToken = randomBytes(32).toString("hex");

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashSessionToken(sessionToken),
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE_MS),
    },
  });

  await prisma.session.deleteMany({
    where: {
      userId,
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  return sessionToken;
}

export async function revokeSessionToken(sessionToken: string) {
  await prisma.session.deleteMany({
    where: {
      tokenHash: hashSessionToken(sessionToken),
    },
  });
}
