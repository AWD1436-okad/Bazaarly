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
      const buyer = await tx.user.findUnique({
        where: { id: user.id },
      });

      const product = await tx.product.findUnique({
        where: { id: productId },
        include: {
          marketState: true,
        },
      });

      if (!buyer || !product || !product.marketState) {
        throw new Error("Supplier product is not available");
      }

      if (product.marketState.supplierStock < quantity) {
        throw new Error("Supplier stock changed");
      }

      const unitCost = product.marketState.currentSupplierPrice;
      const totalCost = unitCost * quantity;

      if (buyer.balance < totalCost) {
        throw new Error("Not enough balance");
      }

      const inventory = await tx.inventory.findUnique({
        where: {
          userId_productId: {
            userId: buyer.id,
            productId: product.id,
          },
        },
      });

      const combinedQuantity = (inventory?.quantity ?? 0) + quantity;
      const weightedCostTotal =
        (inventory?.averageUnitCost ?? 0) * (inventory?.quantity ?? 0) + unitCost * quantity;
      const nextAverageCost =
        combinedQuantity > 0 ? Math.round(weightedCostTotal / combinedQuantity) : unitCost;

      await tx.user.update({
        where: { id: buyer.id },
        data: {
          balance: {
            decrement: totalCost,
          },
        },
      });

      await tx.marketProductState.update({
        where: { productId: product.id },
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
            averageUnitCost: nextAverageCost,
          },
        });
      } else {
        await tx.inventory.create({
          data: {
            userId: buyer.id,
            productId: product.id,
            quantity,
            averageUnitCost: nextAverageCost,
          },
        });
      }

      await tx.notification.create({
        data: {
          userId: buyer.id,
          type: NotificationType.SYSTEM,
          message: `Bought ${quantity}x ${product.name} from Supplier for $${(totalCost / 100).toFixed(2)}.`,
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

  revalidatePath("/dashboard/supplier");
  revalidatePath("/dashboard");
  return NextResponse.redirect(new URL("/dashboard/supplier?purchase=1", request.url), 303);
}
