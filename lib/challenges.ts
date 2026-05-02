import { createHash } from "node:crypto";

import { Prisma, ProductCategory } from "@prisma/client";

import { formatCurrency } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export const CHALLENGE_CYCLE_MS = 5 * 60 * 1000;

export type ChallengeDifficulty = "Easy" | "Medium" | "Hard";

export type ChallengeDefinition = {
  key: string;
  type:
    | "SELL_ITEMS"
    | "ADD_CART_ITEMS"
    | "LIST_PRODUCTS"
    | "EARN_PROFIT"
    | "SELL_CATEGORIES"
    | "BUY_SUPPLIER_STOCK"
    | "CART_VALUE"
    | "RECEIVE_ORDER"
    | "ACTIVE_LISTINGS";
  label: string;
  difficulty: ChallengeDifficulty;
  target: number;
  rewardCents: number;
};

export type ChallengeView = ChallengeDefinition & {
  progress: number;
  progressLabel: string;
  rewardLabel: string;
  completed: boolean;
  rewarded: boolean;
  ratio: number;
};

type ChallengeStats = {
  soldItems: number;
  cartItemsAdded: number;
  listedProducts: number;
  profitEarned: number;
  soldCategories: number;
  supplierStockBought: number;
  cartValue: number;
  receivedOrders: number;
  activeListings: number;
};

const CHALLENGE_LIBRARY: Record<ChallengeDifficulty, ChallengeDefinition[]> = {
  Easy: [
    {
      key: "sell-1-item",
      type: "SELL_ITEMS",
      label: "Sell 1 item",
      difficulty: "Easy",
      target: 1,
      rewardCents: 10000,
    },
    {
      key: "add-3-cart-items",
      type: "ADD_CART_ITEMS",
      label: "Add 3 items to cart",
      difficulty: "Easy",
      target: 3,
      rewardCents: 10000,
    },
    {
      key: "buy-1-supplier-stock",
      type: "BUY_SUPPLIER_STOCK",
      label: "Buy supplier stock",
      difficulty: "Easy",
      target: 1,
      rewardCents: 10000,
    },
    {
      key: "list-2-products",
      type: "LIST_PRODUCTS",
      label: "List 2 products",
      difficulty: "Easy",
      target: 2,
      rewardCents: 10000,
    },
  ],
  Medium: [
    {
      key: "keep-3-active-listings",
      type: "ACTIVE_LISTINGS",
      label: "Keep 3 listings active",
      difficulty: "Medium",
      target: 3,
      rewardCents: 25000,
    },
    {
      key: "earn-50-profit",
      type: "EARN_PROFIT",
      label: "Earn $50 profit",
      difficulty: "Medium",
      target: 5000,
      rewardCents: 25000,
    },
    {
      key: "receive-2-orders",
      type: "RECEIVE_ORDER",
      label: "Receive 2 customer orders",
      difficulty: "Medium",
      target: 2,
      rewardCents: 25000,
    },
    {
      key: "sell-2-categories",
      type: "SELL_CATEGORIES",
      label: "Sell from 2 categories",
      difficulty: "Medium",
      target: 2,
      rewardCents: 25000,
    },
    {
      key: "cart-value-100",
      type: "CART_VALUE",
      label: "Reach $100 cart value",
      difficulty: "Medium",
      target: 10000,
      rewardCents: 25000,
    },
  ],
  Hard: [
    {
      key: "sell-10-items",
      type: "SELL_ITEMS",
      label: "Sell 10 items",
      difficulty: "Hard",
      target: 10,
      rewardCents: 50000,
    },
    {
      key: "sell-3-items",
      type: "SELL_ITEMS",
      label: "Sell 3 items",
      difficulty: "Hard",
      target: 3,
      rewardCents: 50000,
    },
    {
      key: "earn-150-profit",
      type: "EARN_PROFIT",
      label: "Earn $150 profit",
      difficulty: "Hard",
      target: 15000,
      rewardCents: 50000,
    },
  ],
};

const DIFFICULTY_ORDER: ChallengeDifficulty[] = ["Easy", "Easy", "Medium", "Medium", "Hard"];

function getCycleStart(now: Date) {
  return new Date(Math.floor(now.getTime() / CHALLENGE_CYCLE_MS) * CHALLENGE_CYCLE_MS);
}

function getCycleEnd(cycleStartAt: Date) {
  return new Date(cycleStartAt.getTime() + CHALLENGE_CYCLE_MS);
}

function getSeedIndex(seed: string, modulo: number) {
  const digest = createHash("sha256").update(seed).digest("hex");
  return Number.parseInt(digest.slice(0, 8), 16) % modulo;
}

function generateChallenges(userId: string, cycleStartAt: Date) {
  const cycleKey = cycleStartAt.toISOString();
  const usedBaseKeys = new Set<string>();
  return DIFFICULTY_ORDER.map((difficulty, slot) => {
    const options = CHALLENGE_LIBRARY[difficulty];
    const startIndex = getSeedIndex(`${userId}:${cycleKey}:${difficulty}:${slot}`, options.length);
    const selected =
      options.find((_, offset) => {
        const option = options[(startIndex + offset) % options.length];
        return !usedBaseKeys.has(option.key);
      }) ?? options[startIndex];
    usedBaseKeys.add(selected.key);
    return {
      ...selected,
      key: `${selected.key}:${cycleKey}`,
    };
  });
}

function isChallengeDefinition(value: unknown): value is ChallengeDefinition {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ChallengeDefinition>;
  return Boolean(
    candidate.key &&
      candidate.type &&
      candidate.label &&
      candidate.difficulty &&
      typeof candidate.target === "number" &&
      typeof candidate.rewardCents === "number",
  );
}

function parseChallenges(value: Prisma.JsonValue): ChallengeDefinition[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isChallengeDefinition);
}

function parseRewardedKeys(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function getChallengeProgress(challenge: ChallengeDefinition, stats: ChallengeStats) {
  switch (challenge.type) {
    case "SELL_ITEMS":
      return stats.soldItems;
    case "ADD_CART_ITEMS":
      return stats.cartItemsAdded;
    case "LIST_PRODUCTS":
      return stats.listedProducts;
    case "EARN_PROFIT":
      return stats.profitEarned;
    case "SELL_CATEGORIES":
      return stats.soldCategories;
    case "BUY_SUPPLIER_STOCK":
      return stats.supplierStockBought;
    case "CART_VALUE":
      return stats.cartValue;
    case "RECEIVE_ORDER":
      return stats.receivedOrders;
    case "ACTIVE_LISTINGS":
      return stats.activeListings;
  }
}

function getProgressLabel(challenge: ChallengeDefinition, progress: number, currencyCode: string) {
  if (challenge.type === "EARN_PROFIT" || challenge.type === "CART_VALUE") {
    return `${formatCurrency(Math.min(progress, challenge.target), currencyCode)} / ${formatCurrency(
      challenge.target,
      currencyCode,
    )}`;
  }

  return `${Math.min(progress, challenge.target)} / ${challenge.target}`;
}

function getChallengeLabel(challenge: ChallengeDefinition, currencyCode: string) {
  if (challenge.type === "EARN_PROFIT") {
    return `Earn ${formatCurrency(challenge.target, currencyCode)} profit`;
  }

  if (challenge.type === "CART_VALUE") {
    return `Reach ${formatCurrency(challenge.target, currencyCode)} cart value`;
  }

  return challenge.label;
}

export async function getDashboardChallenges({
  userId,
  shopId,
  currencyCode,
  activeListingCount,
  now = new Date(),
}: {
  userId: string;
  shopId: string;
  currencyCode: string;
  activeListingCount: number;
  now?: Date;
}) {
  const cycleStartAt = getCycleStart(now);
  const cycleEndsAt = getCycleEnd(cycleStartAt);
  const generatedChallenges = generateChallenges(userId, cycleStartAt);
  const challengeSet = await prisma.challengeSet.upsert({
    where: {
      userId_cycleStartAt: {
        userId,
        cycleStartAt,
      },
    },
    create: {
      userId,
      cycleStartAt,
      cycleEndsAt,
      challenges: generatedChallenges,
      rewardedKeys: [],
    },
    update: {},
  });

  const challenges = parseChallenges(challengeSet.challenges);
  const rewardedKeys = parseRewardedKeys(challengeSet.rewardedKeys);

  const [
    soldUnitsSummary,
    cartItemsSummary,
    listedProductsCount,
    profitSummary,
    soldCategoryRows,
    supplierStockSummary,
    activeCart,
    receivedOrderCount,
  ] = await Promise.all([
    prisma.orderLineItem.aggregate({
      where: {
        order: {
          sellerId: userId,
          createdAt: {
            gte: cycleStartAt,
            lt: cycleEndsAt,
          },
        },
      },
      _sum: { quantity: true },
    }),
    prisma.cartItem.aggregate({
      where: {
        cart: {
          userId,
        },
        createdAt: {
          gte: cycleStartAt,
          lt: cycleEndsAt,
        },
      },
      _sum: { quantity: true },
    }),
    prisma.listing.count({
      where: {
        shopId,
        createdAt: {
          gte: cycleStartAt,
          lt: cycleEndsAt,
        },
      },
    }),
    prisma.$queryRaw<{ profit: number }[]>(Prisma.sql`
      SELECT
        COALESCE(
          SUM(
            (oli."unitPrice" - COALESCE(NULLIF(inv."averageUnitCost", 0), p."basePrice")) * oli."quantity"
          ),
          0
        )::int AS "profit"
      FROM "OrderLineItem" oli
      INNER JOIN "Order" o ON o."id" = oli."orderId"
      INNER JOIN "Product" p ON p."id" = oli."productId"
      LEFT JOIN "Inventory" inv ON inv."userId" = o."sellerId" AND inv."productId" = oli."productId"
      WHERE o."sellerId" = ${userId}
        AND o."createdAt" >= ${cycleStartAt}
        AND o."createdAt" < ${cycleEndsAt}
    `),
    prisma.orderLineItem.findMany({
      where: {
        order: {
          sellerId: userId,
          createdAt: {
            gte: cycleStartAt,
            lt: cycleEndsAt,
          },
        },
      },
      select: {
        product: {
          select: {
            category: true,
          },
        },
      },
    }),
    prisma.cartItem.aggregate({
      where: {
        source: "SUPPLIER",
        cart: {
          userId,
          status: "CHECKED_OUT",
          updatedAt: {
            gte: cycleStartAt,
            lt: cycleEndsAt,
          },
        },
      },
      _sum: { quantity: true },
    }),
    prisma.cart.findFirst({
      where: {
        userId,
        status: "ACTIVE",
      },
      select: {
        items: {
          select: {
            quantity: true,
            unitPriceSnapshot: true,
          },
        },
      },
    }),
    prisma.order.count({
      where: {
        sellerId: userId,
        createdAt: {
          gte: cycleStartAt,
          lt: cycleEndsAt,
        },
      },
    }),
  ]);

  const cartValue =
    activeCart?.items.reduce((sum, item) => sum + item.quantity * item.unitPriceSnapshot, 0) ?? 0;
  const stats: ChallengeStats = {
    soldItems: soldUnitsSummary._sum.quantity ?? 0,
    cartItemsAdded: cartItemsSummary._sum.quantity ?? 0,
    listedProducts: listedProductsCount,
    profitEarned: profitSummary[0]?.profit ?? 0,
    soldCategories: new Set<ProductCategory>(soldCategoryRows.map((row) => row.product.category)).size,
    supplierStockBought: supplierStockSummary._sum.quantity ?? 0,
    cartValue,
    receivedOrders: receivedOrderCount,
    activeListings: activeListingCount,
  };

  const challengeViews: ChallengeView[] = challenges.slice(0, 5).map((challenge) => {
    const progress = getChallengeProgress(challenge, stats);
    const completed = progress >= challenge.target;
    return {
      ...challenge,
      label: getChallengeLabel(challenge, currencyCode),
      progress,
      progressLabel: getProgressLabel(challenge, progress, currencyCode),
      rewardLabel: formatCurrency(challenge.rewardCents, currencyCode),
      completed,
      rewarded: rewardedKeys.includes(challenge.key),
      ratio: challenge.target > 0 ? Math.min(1, progress / challenge.target) : 0,
    };
  });

  const newlyCompleted = challengeViews.filter((challenge) => challenge.completed && !challenge.rewarded);
  if (newlyCompleted.length > 0) {
    const newRewardedKeys = [...rewardedKeys, ...newlyCompleted.map((challenge) => challenge.key)];
    const rewardTotal = newlyCompleted.reduce((sum, challenge) => sum + challenge.rewardCents, 0);

    await prisma.$transaction(async (tx) => {
      const freshSet = await tx.challengeSet.findUnique({
        where: { id: challengeSet.id },
        select: { rewardedKeys: true },
      });
      const freshRewardedKeys = parseRewardedKeys(freshSet?.rewardedKeys ?? []);
      const freshNew = newlyCompleted.filter((challenge) => !freshRewardedKeys.includes(challenge.key));
      if (freshNew.length === 0) return;
      const freshRewardTotal = freshNew.reduce((sum, challenge) => sum + challenge.rewardCents, 0);

      await tx.user.update({
        where: { id: userId },
        data: {
          balance: {
            increment: freshRewardTotal,
          },
        },
      });
      await tx.challengeSet.update({
        where: { id: challengeSet.id },
        data: {
          rewardedKeys: [...freshRewardedKeys, ...freshNew.map((challenge) => challenge.key)],
        },
      });
      await tx.notification.create({
        data: {
          userId,
          type: "SYSTEM",
          message: `Challenge reward earned: ${formatCurrency(freshRewardTotal, currencyCode)}.`,
        },
      });
    });

    for (const challenge of challengeViews) {
      if (newRewardedKeys.includes(challenge.key)) {
        challenge.rewarded = true;
      }
    }
  }

  return {
    cycleStartAt,
    cycleEndsAt,
    secondsRemaining: Math.max(0, Math.ceil((cycleEndsAt.getTime() - now.getTime()) / 1000)),
    challenges: challengeViews,
  };
}
