import { NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clamp } from "@/lib/utils";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const cart = await prisma.cart.findFirst({
    where: {
      userId: user.id,
      status: "ACTIVE",
    },
    include: {
      shop: {
        include: {
          owner: true,
        },
      },
      items: {
        include: {
          listing: {
            include: {
              product: true,
              shop: true,
            },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0 || !cart.shop) {
    return NextResponse.redirect(new URL("/cart?error=Your%20cart%20is%20empty", request.url), 303);
  }

  try {
    await prisma.$transaction(async (tx) => {
      const buyer = await tx.user.findUnique({
        where: { id: user.id },
      });

      const seller = await tx.user.findUnique({
        where: { id: cart.shop!.ownerId },
      });

      if (!buyer || !seller) {
        throw new Error("Buyer or seller not found");
      }

      let totalPrice = 0;
      const saleSummary: string[] = [];

      for (const item of cart.items) {
        const listing = await tx.listing.findUnique({
          where: { id: item.listingId },
          include: {
            product: true,
          },
        });

        if (!listing || !listing.active || listing.quantity < item.quantity) {
          throw new Error("Listing stock changed");
        }

        totalPrice += listing.price * item.quantity;
        saleSummary.push(`${item.quantity}x ${listing.product.name}`);
      }

      if (buyer.balance < totalPrice) {
        throw new Error("Not enough balance");
      }

      const order = await tx.order.create({
        data: {
          buyerId: buyer.id,
          sellerId: seller.id,
          shopId: cart.shopId!,
          totalPrice,
        },
      });

      await tx.user.update({
        where: { id: buyer.id },
        data: {
          balance: {
            decrement: totalPrice,
          },
        },
      });

      await tx.user.update({
        where: { id: seller.id },
        data: {
          balance: {
            increment: totalPrice,
          },
        },
      });

      for (const item of cart.items) {
        const listing = await tx.listing.findUnique({
          where: { id: item.listingId },
        });

        if (!listing) continue;

        await tx.listing.update({
          where: { id: listing.id },
          data: {
            quantity: {
              decrement: item.quantity,
            },
            active: listing.quantity - item.quantity > 0,
          },
        });

        const inventory = await tx.inventory.findUnique({
          where: {
            userId_productId: {
              userId: seller.id,
              productId: item.productId,
            },
          },
        });

        if (inventory) {
          await tx.inventory.update({
            where: { id: inventory.id },
            data: {
              quantity: {
                decrement: item.quantity,
              },
              allocatedQuantity: {
                decrement: item.quantity,
              },
            },
          });
        }

        await tx.orderLineItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            listingId: item.listingId,
            quantity: item.quantity,
            unitPrice: item.unitPriceSnapshot,
            lineTotal: item.unitPriceSnapshot * item.quantity,
          },
        });

        if (listing.quantity - item.quantity <= 3) {
          await tx.notification.create({
            data: {
              userId: seller.id,
              type: NotificationType.LOW_STOCK,
              message: `${item.listing.product.name} is running low. Only ${Math.max(
                listing.quantity - item.quantity,
                0,
              )} left in your live listing.`,
            },
          });
        }
      }

      await tx.shop.update({
        where: { id: cart.shopId! },
        data: {
          totalRevenue: {
            increment: totalPrice,
          },
          totalSales: {
            increment: cart.items.reduce((sum, item) => sum + item.quantity, 0),
          },
          rating: clamp(cart.shop!.rating + 0.03, 1, 5),
        },
      });

      await tx.notification.create({
        data: {
          userId: seller.id,
          type: NotificationType.SALE,
          message: `${buyer.displayName} bought ${saleSummary.join(", ")} for $${(
            totalPrice / 100
          ).toFixed(2)}.`,
        },
      });

      await tx.cart.update({
        where: { id: cart.id },
        data: {
          status: "CHECKED_OUT",
        },
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    return NextResponse.redirect(
      new URL(`/cart?error=${encodeURIComponent(message)}`, request.url),
      303,
    );
  }

  revalidatePath("/marketplace");
  revalidatePath("/cart");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  return NextResponse.redirect(new URL("/orders?checkout=1", request.url), 303);
}
