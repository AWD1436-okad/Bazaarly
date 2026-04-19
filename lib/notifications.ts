import { cache } from "react";

import { prisma } from "@/lib/prisma";

const NOTIFICATION_BADGE_LIMIT = 10;

export const getUnreadNotificationBadge = cache(async (userId: string) => {
  const unreadRows = await prisma.notification.findMany({
    where: {
      userId,
      read: false,
    },
    select: {
      id: true,
    },
    take: NOTIFICATION_BADGE_LIMIT,
  });

  const unreadCount = unreadRows.length;

  return {
    unreadCount,
    label:
      unreadCount === 0
        ? null
        : unreadCount >= NOTIFICATION_BADGE_LIMIT
          ? "9+"
          : String(unreadCount),
  };
});
