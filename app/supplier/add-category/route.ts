import { Prisma, ProductCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSessionUser, hasCompletedSecuritySetup } from "@/lib/auth";
import { getCategoryFilterOption } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { clamp } from "@/lib/utils";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

function isAsyncRequest(request: Request) {
  return request.headers.get("x-tradex-async") === "1";
}

function redirectWithError(request: Request, message: string) {
  return NextResponse.redirect(
    new URL(`/dashboard/supplier?error=${encodeURIComponent(message)}`, request.url),
    303,
  );
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
  const categoryValue = String(formData.get("category") ?? "");
  const quantityPerItemValue = Number.parseInt(String(formData.get("quantityPerItem") ?? "1"), 10);
  const quantityPerItem = Number.isFinite(quantityPerItemValue)
    ? clamp(quantityPerItemValue, 1, 99)
    : 1;
  const selectedCategory = getCategoryFilterOption(categoryValue);

  if (!selectedCategory) {
    if (asyncRequest) {
      return NextResponse.json({ ok: false, error: "Choose a category first" }, { status: 400 });
    }
    return redirectWithError(request, "Choose a category first");
  }

  const products = await prisma.product.findMany({
    where: {
      category: selectedCategory.category ?? (selectedCategory.value as ProductCategory),
      ...(selectedCategory.subcategory !== undefined
        ? { subcategory: selectedCategory.subcategory }
        : {}),
      marketState: {
        supplierStock: { gt: 0 },
        currentSupplierPrice: { gt: 0 },
      },
    },
    select: {
      id: true,
      marketState: {
        select: {
          currentSupplierPrice: true,
          supplierStock: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  if (products.length === 0) {
    if (asyncRequest) {
      return NextResponse.json(
        { ok: false, error: "No in-stock supplier items in that category" },
        { status: 400 },
      );
    }
    return redirectWithError(request, "No in-stock supplier items in that category");
  }

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

    for (const product of products) {
      const supplierPrice = product.marketState?.currentSupplierPrice ?? 0;
      const supplierStock = product.marketState?.supplierStock ?? 0;

      if (supplierPrice <= 0 || supplierStock <= 0) {
        continue;
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

      if (cartItem) {
        if (cartItem.quantity >= supplierStock) {
          continue;
        }
        const nextQuantity = Math.min(supplierStock, cartItem.quantity + quantityPerItem);

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
            productId: product.id,
            source: "SUPPLIER",
            quantity: Math.min(quantityPerItem, supplierStock),
            unitPriceSnapshot: supplierPrice,
          },
        });
      }
    }
  });

  revalidatePath("/cart");
  revalidatePath("/dashboard/supplier");
  if (asyncRequest) {
    return NextResponse.json({
      ok: true,
      addedCount: products.length,
      quantityPerItem,
    });
  }
  return NextResponse.redirect(new URL("/cart?added=1", request.url), 303);
}
