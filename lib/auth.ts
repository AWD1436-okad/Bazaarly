import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME ?? "bazaarly_session";

const getSessionUserById = cache(async (userId: string) =>
  prisma.user.findUnique({
    where: { id: userId },
    include: {
      shop: true,
    },
  }),
);

export async function getSessionUser() {
  const sessionValue = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  if (!sessionValue) {
    return null;
  }

  return getSessionUserById(sessionValue);
}

export async function requireUser() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function setSession(userId: string) {
  (await cookies()).set(SESSION_COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE_NAME);
}

export function getPostLoginRedirect(hasShop: boolean) {
  return hasShop ? "/dashboard" : "/onboarding/shop";
}
