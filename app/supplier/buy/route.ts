import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSessionUser, hasCompletedSecuritySetup } from "@/lib/auth";
import { getActiveCurrencyCode } from "@/lib/price-profiles";
import { prisma } from "@/lib/prisma";
import { parsePositiveQuantity, parseRouteId } from "@/lib/route-validation";
import { clamp } from "@/lib/utils";

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
  const productIdResult = parseRouteId(formData, "productId");
  const quantityResult = parsePositiveQuantity(formData, "quantity");

  if (!productIdResult.success || !quantityResult.success) {
    if (asyncRequest) {
      return NextResponse.json(
        { ok: false, error: "Enter a valid product and quantity" },
        { status: 400 },
      );
    }
    return NextResponse.redirect(
      new URL("/dashboard/supplier?error=Enter%20a%20valid%20product%20and%20quantity", request.url),
      303,
    );
  }

  const productId = productIdResult.data;
  const quantity = clamp(quantityResult.data, 1, 99);
  const currencyCode = await getActiveCurrencyCode();

  try {
    let purchasedProductName = "";
    let purchaseTotalCost = 0;

    await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        include: {
          marketState: true,
          priceProfiles: {
            where: {
              currencyCode,
            },
          },
        },
      });

      if (!product || !product.marketState) {
        throw new Error("Supplier product is not available");
      }

      if (product.marketState.supplierStock < quantity) {
        throw new Error("Supplier stock changed");
      }

      const regionalProfile = product.priceProfiles[0];
      const unitCost = regionalProfile?.supplierPrice ?? product.marketState.currentSupplierPrice;
      const totalCost = unitCost * quantity;
      purchasedProductName = product.name;
      purchaseTotalCost = totalCost;

      let cart = await tx.cart.findFirst({
        where: {
          userId: user.id,
          status: "ACTIVE",
        },
        orderBy: [{ updatedAt: "desc" }],
      });

      if (!cart) {
        try {
          cart = await tx.cart.create({
            data: {
              userId: user.id,
            },
          });
        } catch (error) {
          if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
            throw error;
          }

          cart = await tx.cart.findFirst({
            where: {
              userId: user.id,
              status: "ACTIVE",
            },
            orderBy: [{ updatedAt: "desc" }],
          });
        }
      }

      if (!cart) {
        throw new Error("Unable to open your cart right now");
      }

      const cartItem = await tx.cartItem.findUnique({
        where: {
          cartId_productId_source: {
            cartId: cart.id,
            productId: product.id,
            source: "SUPPLIER",
          },
        },
      });

      const nextQuantity = (cartItem?.quantity ?? 0) + quantity;

      if (nextQuantity > product.marketState.supplierStock) {
        throw new Error("Supplier stock changed");
      }

      if (cartItem) {
        await tx.cartItem.update({
          where: { id: cartItem.id },
          data: {
            quantity: nextQuantity,
            unitPriceSnapshot: unitCost,
          },
        });
      } else {
        await tx.cartItem.create({
          data: {
            cartId: cart.id,
            productId: product.id,
            source: "SUPPLIER",
            quantity,
            unitPriceSnapshot: unitCost,
          },
        });
      }
    });

    revalidatePath("/dashboard/supplier");
    revalidatePath("/cart");

    if (asyncRequest) {
      return NextResponse.json({
        ok: true,
        productName: purchasedProductName,
        totalCost: purchaseTotalCost,
      });
    }

    return NextResponse.redirect(new URL("/cart?added=1", request.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to add supplier item to cart";
    if (asyncRequest) {
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
    return NextResponse.redirect(
      new URL(`/dashboard/supplier?error=${encodeURIComponent(message)}`, request.url),
      303,
    );
  }
}
