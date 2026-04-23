import { prisma } from "@/lib/prisma";

export async function getLiveStateVersion(userId: string) {
  const [user, unreadNotifications, latestNotification, latestSale, latestListing, latestInventory] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          balance: true,
          shop: {
            select: {
              id: true,
              totalRevenue: true,
              totalSales: true,
              updatedAt: true,
            },
          },
        },
      }),
      prisma.notification.count({
        where: {
          userId,
          read: false,
        },
      }),
      prisma.notification.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          read: true,
        },
      }),
      prisma.order.findFirst({
        where: { sellerId: userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          totalPrice: true,
        },
      }),
      prisma.listing.findFirst({
        where: {
          shop: {
            ownerId: userId,
          },
        },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          updatedAt: true,
          quantity: true,
          active: true,
        },
      }),
      prisma.inventory.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          updatedAt: true,
          quantity: true,
          allocatedQuantity: true,
        },
      }),
    ]);

  const parts = [
    user?.balance ?? "no-user",
    user?.shop?.id ?? "no-shop",
    user?.shop?.totalRevenue ?? 0,
    user?.shop?.totalSales ?? 0,
    user?.shop?.updatedAt?.toISOString() ?? "no-shop-update",
    unreadNotifications,
    latestNotification?.id ?? "no-notification",
    latestNotification?.createdAt.toISOString() ?? "no-notification-time",
    latestNotification?.read ?? "no-notification-read",
    latestSale?.id ?? "no-sale",
    latestSale?.createdAt.toISOString() ?? "no-sale-time",
    latestSale?.totalPrice ?? 0,
    latestListing?.id ?? "no-listing",
    latestListing?.updatedAt.toISOString() ?? "no-listing-time",
    latestListing?.quantity ?? "no-listing-qty",
    latestListing?.active ?? "no-listing-active",
    latestInventory?.id ?? "no-inventory",
    latestInventory?.updatedAt.toISOString() ?? "no-inventory-time",
    latestInventory?.quantity ?? "no-inventory-qty",
    latestInventory?.allocatedQuantity ?? "no-inventory-allocated",
  ];

  return parts.join("|");
}
