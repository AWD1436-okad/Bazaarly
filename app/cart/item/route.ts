import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSessionUser, hasCompletedSecuritySetup } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clamp } from "@/lib/utils";
import { parseNonNegativeQuantity, parseRouteId } from "@/lib/route-validation";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

function isAsyncRequest(request: Request) {
  return request.headers.get("x-bazaarly-async") === "1";
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

  const formData = await request.formData();
  const cartItemIdResult = parseRouteId(formData, "cartItemId");
  const quantityResult = parseNonNegativeQuantity(formData, "quantity");

  if (!cartItemIdResult.success || !quantityResult.success) {
    if (asyncRequest) {
      return NextResponse.json(
        { ok: false, error: "Enter a valid cart quantity" },
        { status: 400 },
      );
    }
    return NextResponse.redirect(new URL("/cart?error=Enter%20a%20valid%20cart%20quantity", request.url), 303);
  }

  const cartItemId = cartItemIdResult.data;
  const quantity = quantityResult.data;

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: {
      cart: true,
      listing: true,
      product: {
        include: {
          marketState: true,
        },
      },
    },
  });

  if (!cartItem || cartItem.cart.userId !== user.id) {
    if (asyncRequest) {
      return NextResponse.json({ ok: false, error: "Cart item not found" }, { status: 404 });
    }
    return NextResponse.redirect(new URL("/cart", request.url), 303);
  }

  const availableQuantity =
    cartItem.source === "SUPPLIER"
      ? cartItem.product.marketState?.supplierStock ?? 0
      : cartItem.listing?.quantity ?? 0;

  const shouldRemove =
    quantity <= 0 ||
    availableQuantity <= 0 ||
    (cartItem.source === "MARKETPLACE" && (!cartItem.listing || !cartItem.listing.active));

  if (shouldRemove) {
    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });
  } else {
      const safeQuantity = clamp(quantity, 1, availableQuantity);
      if (safeQuantity <= 0) {
        await prisma.cartItem.delete({
          where: { id: cartItemId },
      });
    } else {
        await prisma.cartItem.update({
          where: { id: cartItemId },
          data: {
            quantity: safeQuantity,
            unitPriceSnapshot:
              cartItem.source === "SUPPLIER"
                ? cartItem.product.marketState?.currentSupplierPrice ?? cartItem.unitPriceSnapshot
                : cartItem.listing?.price ?? cartItem.unitPriceSnapshot,
          },
        });
    }
  }

  revalidatePath("/cart");
  if (asyncRequest) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.redirect(new URL("/cart", request.url), 303);
}
