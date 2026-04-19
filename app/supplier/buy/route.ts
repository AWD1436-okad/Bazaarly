import { NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePositiveQuantity, parseRouteId } from "@/lib/route-validation";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }
  if (!user.shop) {
    return NextResponse.redirect(new URL("/onboarding/shop", request.url), 303);
  }

  const formData = await request.formData();
  const productIdResult = parseRouteId(formData, "productId");
  const quantityResult = parsePositiveQuantity(formData, "quantity");

  if (!productIdResult.success || !quantityResult.success) {
    return NextResponse.redirect(
      new URL("/dashboard/supplier?error=Enter%20a%20valid%20product%20and%20quantity", request.url),
      303,
    );
  }

  const productId = productIdResult.data;
  const quantity = quantityResult.data;

  try {
    await prisma.$transaction(async (tx) => {
      const state = await tx.marketProductState.findUnique({
        where: { productId },
        include: { product: true },
      });

      if (!state) {
        throw new Error("Supplier item not found");
      }

      const totalCost = state.currentSupplierPrice * quantity;
      const currentUser = await tx.user.findUnique({ where: { id: user.id } });

      if (!currentUser || currentUser.balance < totalCost) {
        throw new Error("Not enough balance");
      }

      if (state.supplierStock < quantity) {
        throw new Error("Supplier stock is too low for that purchase");
      }

      const inventory = await tx.inventory.findUnique({
        where: {
          userId_productId: {
            userId: user.id,
            productId,
          },
        },
      });

      const newQuantity = (inventory?.quantity ?? 0) + quantity;
      const combinedCost =
        (inventory?.averageUnitCost ?? 0) * (inventory?.quantity ?? 0) +
        state.currentSupplierPrice * quantity;

      await tx.user.update({
        where: { id: user.id },
        data: {
          balance: {
            decrement: totalCost,
          },
        },
      });

      await tx.marketProductState.update({
        where: { productId },
        data: {
          supplierStock: {
            decrement: quantity,
          },
        },
      });

      if (inventory) {
        await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            quantity: {
              increment: quantity,
            },
            averageUnitCost: Math.round(combinedCost / newQuantity),
          },
        });
      } else {
        await tx.inventory.create({
          data: {
            userId: user.id,
            productId,
            quantity,
            averageUnitCost: state.currentSupplierPrice,
          },
        });
      }

      await tx.notification.create({
        data: {
          userId: user.id,
          type: NotificationType.SYSTEM,
          message: `Supplier purchase complete: ${quantity}x ${state.product.name} added to your inventory.`,
        },
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Supplier purchase failed";
    return NextResponse.redirect(
      new URL(`/dashboard/supplier?error=${encodeURIComponent(message)}`, request.url),
      303,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/supplier");
  return NextResponse.redirect(new URL("/dashboard?supplierSuccess=1", request.url), 303);
}
