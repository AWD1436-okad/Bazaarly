import { NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSafePositiveQuantity } from "@/lib/route-validation";
import { getLiveStockStatusMessage, sanitizeStockCount } from "@/lib/stock";
import { clamp } from "@/lib/utils";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const activeCart = await prisma.cart.findFirst({
    where: {
      userId: user.id,
      status: "ACTIVE",
    },
    select: {
      id: true,
    },
  });

  if (!activeCart) {
    return NextResponse.redirect(new URL("/cart?error=Your%20cart%20is%20empty", request.url), 303);
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Cart" WHERE "id" = ${activeCart.id} FOR UPDATE`;

      const cart = await tx.cart.findFirst({
        where: {
          id: activeCart.id,
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
        throw new Error("Your cart is empty");
      }

      const hasInvalidCartState = cart.items.some(
        (item) =>
          !item.listingId ||
          !item.productId ||
          !isSafePositiveQuantity(item.quantity, 999) ||
          !isSafePositiveQuantity(item.unitPriceSnapshot) ||
          item.listing.shopId !== cart.shopId,
      );

      if (hasInvalidCartState) {
        throw new Error("Your cart has invalid items. Please refresh and try again");
      }

      const buyer = await tx.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          displayName: true,
          balance: true,
        },
      });

      const seller = await tx.user.findUnique({
        where: { id: cart.shop!.ownerId },
        select: {
          id: true,
          balance: true,
        },
      });

      if (!buyer || !seller) {
        throw new Error("Buyer or seller not found");
      }

      let totalPrice = 0;
      const saleSummary: string[] = [];
      const preparedItems: Array<{
        quantity: number;
        unitPrice: number;
        lineTotal: number;
        listing: {
          id: string;
          shopId: string;
          productId: string;
          price: number;
          quantity: number;
          active: boolean;
          product: {
            name: string;
          };
        };
        inventory: {
          id: string;
          quantity: number;
          allocatedQuantity: number;
        };
      }> = [];

      for (const item of cart.items) {
        await tx.$queryRaw`SELECT "id" FROM "Listing" WHERE "id" = ${item.listingId} FOR UPDATE`;

        const listing = await tx.listing.findUnique({
          where: { id: item.listingId },
          include: {
            product: true,
          },
        });

        if (!listing || !listing.active || listing.quantity < item.quantity) {
          throw new Error("Listing stock changed");
        }
        if (listing.shopId !== cart.shopId || listing.productId !== item.productId) {
          throw new Error("Cart item no longer matches its listing");
        }
        if (listing.price !== item.unitPriceSnapshot) {
          throw new Error(`${listing.product.name} changed price. Please review your cart and try again`);
        }

        const inventory = await tx.inventory.findUnique({
          where: {
            userId_productId: {
              userId: seller.id,
              productId: item.productId,
            },
          },
          select: {
            id: true,
            quantity: true,
            allocatedQuantity: true,
          },
        });

        if (!inventory || inventory.quantity < item.quantity || inventory.allocatedQuantity < item.quantity) {
          throw new Error(`${listing.product.name} no longer has enough seller stock`);
        }

        await tx.$queryRaw`SELECT "id" FROM "Inventory" WHERE "id" = ${inventory.id} FOR UPDATE`;

        const lineTotal = item.unitPriceSnapshot * item.quantity;

        totalPrice += lineTotal;
        saleSummary.push(`${item.quantity}x ${listing.product.name}`);
        preparedItems.push({
          quantity: item.quantity,
          unitPrice: item.unitPriceSnapshot,
          lineTotal,
          listing,
          inventory,
        });
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

      for (const item of preparedItems) {
        const remainingListingQuantity = sanitizeStockCount(item.listing.quantity - item.quantity);
        const remainingInventoryQuantity = sanitizeStockCount(item.inventory.quantity - item.quantity);
        const remainingAllocatedQuantity = sanitizeStockCount(
          item.inventory.allocatedQuantity - item.quantity,
        );

        await tx.listing.update({
          where: { id: item.listing.id },
          data: {
            quantity: remainingListingQuantity,
            active: remainingListingQuantity > 0,
          },
        });

        await tx.inventory.update({
          where: { id: item.inventory.id },
          data: {
            quantity: remainingInventoryQuantity,
            allocatedQuantity: remainingAllocatedQuantity,
          },
        });

        const buyerInventory = await tx.inventory.findUnique({
          where: {
            userId_productId: {
              userId: buyer.id,
              productId: item.listing.productId,
            },
          },
          select: {
            id: true,
            quantity: true,
            allocatedQuantity: true,
            averageUnitCost: true,
          },
        });

        const buyerListing = user.shop
          ? await tx.listing.findUnique({
              where: {
                shopId_productId: {
                  shopId: user.shop.id,
                  productId: item.listing.productId,
                },
              },
              select: {
                id: true,
                quantity: true,
              },
            })
          : null;
        const shouldRestockBuyerListing = Boolean(buyerListing);

        const nextBuyerQuantity = (buyerInventory?.quantity ?? 0) + item.quantity;
        const buyerCostTotal =
          (buyerInventory?.averageUnitCost ?? 0) * (buyerInventory?.quantity ?? 0) +
          item.unitPrice * item.quantity;
        const nextBuyerAverageCost =
          nextBuyerQuantity > 0 ? Math.round(buyerCostTotal / nextBuyerQuantity) : item.unitPrice;
        const nextAllocatedQuantity =
          (buyerInventory?.allocatedQuantity ?? 0) + (shouldRestockBuyerListing ? item.quantity : 0);

        if (buyerInventory) {
          await tx.inventory.update({
            where: { id: buyerInventory.id },
            data: {
              quantity: {
                increment: item.quantity,
              },
              allocatedQuantity: nextAllocatedQuantity,
              averageUnitCost: nextBuyerAverageCost,
            },
          });
        } else {
          await tx.inventory.create({
            data: {
              userId: buyer.id,
              productId: item.listing.productId,
              quantity: item.quantity,
              allocatedQuantity: shouldRestockBuyerListing ? item.quantity : 0,
              averageUnitCost: nextBuyerAverageCost,
            },
          });
        }

        if (shouldRestockBuyerListing && buyerListing) {
          await tx.listing.update({
            where: { id: buyerListing.id },
            data: {
              quantity: {
                increment: item.quantity,
              },
              active: true,
            },
          });
        }

        await tx.orderLineItem.create({
          data: {
            orderId: order.id,
            productId: item.listing.productId,
            listingId: item.listing.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
          },
        });

        if (remainingListingQuantity <= 3) {
          await tx.notification.create({
            data: {
              userId: seller.id,
              type: NotificationType.LOW_STOCK,
              message: `${item.listing.product.name}: ${getLiveStockStatusMessage(
                remainingListingQuantity,
              )}.`,
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
  revalidatePath("/dashboard/supplier");
  revalidatePath("/notifications");
  return NextResponse.redirect(new URL("/orders?checkout=1", request.url), 303);
}
