import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSessionUser, hasCompletedSecuritySetup } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clamp } from "@/lib/utils";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

function redirectWithError(request: Request, message: string) {
  return NextResponse.redirect(
    new URL(`/dashboard/supplier?error=${encodeURIComponent(message)}`, request.url),
    303,
  );
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }
  if (!hasCompletedSecuritySetup(user)) {
    return NextResponse.redirect(new URL("/security-setup", request.url), 303);
  }

  const formData = await request.formData();
  const selectedEntries = Array.from(formData.entries())
    .filter(([key]) => key.startsWith("qty:"))
    .map(([key, value]) => {
      const productId = key.slice(4);
      const parsed = Number.parseInt(String(value ?? "0"), 10);
      return {
        productId,
        quantity: Number.isFinite(parsed) ? clamp(parsed, 0, 99) : 0,
      };
    })
    .filter((entry) => entry.productId.length > 0 && entry.quantity > 0);

  if (selectedEntries.length === 0) {
    return redirectWithError(request, "Select at least one product quantity greater than zero");
  }

  const selectedProductIds = selectedEntries.map((entry) => entry.productId);
  const quantityMap = new Map(selectedEntries.map((entry) => [entry.productId, entry.quantity]));

  const soldOutListings = await prisma.listing.findMany({
    where: {
      shop: {
        ownerId: user.id,
      },
      productId: {
        in: selectedProductIds,
      },
      quantity: { lte: 0 },
    },
    select: {
      productId: true,
    },
  });

  if (soldOutListings.length === 0) {
    return redirectWithError(request, "No sold-out listings matched your restock selection");
  }

  const allowedProductIds = new Set(soldOutListings.map((listing) => listing.productId));

  await prisma.$transaction(async (tx) => {
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

    for (const productId of allowedProductIds) {
      const requestedQuantity = quantityMap.get(productId) ?? 0;
      if (requestedQuantity <= 0) {
        continue;
      }

      const product = await tx.product.findUnique({
        where: { id: productId },
        include: {
          marketState: {
            select: {
              currentSupplierPrice: true,
              supplierStock: true,
            },
          },
        },
      });

      const supplierPrice = product?.marketState?.currentSupplierPrice ?? 0;
      const supplierStock = product?.marketState?.supplierStock ?? 0;

      if (!product || supplierPrice <= 0 || supplierStock <= 0) {
        continue;
      }

      const cartItem = await tx.cartItem.findUnique({
        where: {
          cartId_productId_source: {
            cartId: cart.id,
            productId,
            source: "SUPPLIER",
          },
        },
      });

      const existingQuantity = cartItem?.quantity ?? 0;
      const nextQuantity = Math.min(supplierStock, existingQuantity + requestedQuantity);

      if (nextQuantity <= existingQuantity) {
        continue;
      }

      if (cartItem) {
        await tx.cartItem.update({
          where: { id: cartItem.id },
          data: {
            quantity: nextQuantity,
            unitPriceSnapshot: supplierPrice,
          },
        });
      } else {
        await tx.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            source: "SUPPLIER",
            quantity: nextQuantity,
            unitPriceSnapshot: supplierPrice,
          },
        });
      }
    }
  });

  revalidatePath("/dashboard/supplier");
  revalidatePath("/cart");
  return NextResponse.redirect(new URL("/cart?added=1", request.url), 303);
}
