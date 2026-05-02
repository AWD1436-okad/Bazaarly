import { NotificationType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const SOLD_OUT_AUTO_REMOVE_MS = 20 * 60 * 1000;

export async function runSoldOutListingCleanup(now = new Date()) {
  await prisma.listing.updateMany({
    where: {
      active: true,
      isPaused: false,
      quantity: { lte: 0 },
      soldOutAt: null,
    },
    data: {
      soldOutAt: now,
    },
  });

  const cutoff = new Date(now.getTime() - SOLD_OUT_AUTO_REMOVE_MS);
  const expiredListings = await prisma.listing.findMany({
    where: {
      active: true,
      isPaused: false,
      quantity: { lte: 0 },
      soldOutAt: { lte: cutoff },
    },
    select: {
      id: true,
      soldOutAt: true,
      product: {
        select: {
          name: true,
        },
      },
      shop: {
        select: {
          ownerId: true,
        },
      },
    },
    take: 25,
  });

  for (const listing of expiredListings) {
    await prisma.$transaction(async (tx) => {
      const removed = await tx.listing.updateMany({
        where: {
          id: listing.id,
          active: true,
          isPaused: false,
          quantity: { lte: 0 },
          soldOutAt: listing.soldOutAt,
        },
        data: {
          active: false,
        },
      });

      if (removed.count === 0) return;

      await tx.notification.create({
        data: {
          userId: listing.shop.ownerId,
          type: NotificationType.SYSTEM,
          message: `Your listing for ${listing.product.name} was removed because it stayed sold out for 20 minutes.`,
        },
      });
    });
  }

  return {
    autoRemoved: expiredListings.length,
  };
}
