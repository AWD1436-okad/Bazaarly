import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSessionUser, hasCompletedSecuritySetup } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

function isAsyncRequest(request: Request) {
  return request.headers.get("x-tradex-async") === "1";
}

export async function POST(request: Request) {
  const asyncRequest = isAsyncRequest(request);
  const user = await getSessionUser();

  if (!user) {
    if (asyncRequest) {
      return NextResponse.json({ ok: false, error: "Login required" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  if (!hasCompletedSecuritySetup(user)) {
    if (asyncRequest) {
      return NextResponse.json({ ok: false, error: "Complete security setup first" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/security-setup", request.url), 303);
  }

  const cart = await prisma.cart.findFirst({
    where: {
      userId: user.id,
      status: "ACTIVE",
    },
    select: {
      id: true,
    },
  });

  if (cart) {
    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });

    await prisma.cart.update({
      where: { id: cart.id },
      data: { shopId: null },
    });
  }

  revalidatePath("/cart");

  if (asyncRequest) {
    return NextResponse.json({ ok: true, message: "Cart cleared" });
  }

  return NextResponse.redirect(new URL("/cart", request.url), 303);
}
