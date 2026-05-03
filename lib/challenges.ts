import { createHash } from "node:crypto";

import { Prisma, ProductCategory } from "@prisma/client";

import { getNetProfitSummary } from "@/lib/business-ledger";
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
  supplierStockBoughtValue: number;
  cartValue: number;
  receivedOrders: number;
  activeListings: number;
};

const REWARD_CENTS: Record<ChallengeDifficulty, number> = {
  Easy: 5_000,
  Medium: 10_000,
  Hard: 15_000,
};

const CHALLENGE_LIBRARY: Record<ChallengeDifficulty, ChallengeDefinition[]> = {
  Easy: [
    {
      key: "sell-5-items",
      type: "SELL_ITEMS",
      label: "Sell 5 items",
      difficulty: "Easy",
      target: 5,
      rewardCents: REWARD_CENTS.Easy,
    },
    {
      key: "earn-150-profit",
      type: "EARN_PROFIT",
      label: "Earn $150 profit",
      difficulty: "Easy",
      target: 15_000,
      rewardCents: REWARD_CENTS.Easy,
    },
    {
      key: "buy-250-supplier-stock",
      type: "BUY_SUPPLIER_STOCK",
      label: "Add $250 worth of supplier stock",
      difficulty: "Easy",
      target: 25_000,
      rewardCents: REWARD_CENTS.Easy,
    },
    {
      key: "list-5-products",
      type: "LIST_PRODUCTS",
      label: "List 5 products",
      difficulty: "Easy",
      target: 5,
      rewardCents: REWARD_CENTS.Easy,
    },
    {
      key: "sell-2-categories",
      type: "SELL_CATEGORIES",
      label: "Sell from 2 categories",
      difficulty: "Easy",
      target: 2,
      rewardCents: REWARD_CENTS.Easy,
    },
    {
      key: "keep-5-active-listings",
      type: "ACTIVE_LISTINGS",
      label: "Keep 5 listings active",
      difficulty: "Easy",
      target: 5,
      rewardCents: REWARD_CENTS.Easy,
    },
  ],
  Medium: [
    {
      key: "sell-15-items",
      type: "SELL_ITEMS",
      label: "Sell 15 items",
      difficulty: "Medium",
      target: 15,
      rewardCents: REWARD_CENTS.Medium,
    },
    {
      key: "keep-12-active-listings",
      type: "ACTIVE_LISTINGS",
      label: "Keep 12 listings active",
      difficulty: "Medium",
      target: 12,
      rewardCents: REWARD_CENTS.Medium,
    },
    {
      key: "earn-500-profit",
      type: "EARN_PROFIT",
      label: "Earn $500 profit",
      difficulty: "Medium",
      target: 50_000,
      rewardCents: REWARD_CENTS.Medium,
    },
    {
      key: "receive-5-orders",
      type: "RECEIVE_ORDER",
      label: "Complete 5 orders",
      difficulty: "Medium",
      target: 5,
      rewardCents: REWARD_CENTS.Medium,
    },
    {
      key: "sell-4-categories",
      type: "SELL_CATEGORIES",
      label: "Sell from 4 categories",
      difficulty: "Medium",
      target: 4,
      rewardCents: REWARD_CENTS.Medium,
    },
    {
      key: "list-10-products",
      type: "LIST_PRODUCTS",
      label: "List 10 products",
      difficulty: "Medium",
      target: 10,
      rewardCents: REWARD_CENTS.Medium,
    },
  ],
  Hard: [
    {
      key: "sell-30-items",
      type: "SELL_ITEMS",
      label: "Sell 30 items",
      difficulty: "Hard",
      target: 30,
      rewardCents: REWARD_CENTS.Hard,
    },
    {
      key: "earn-1500-profit",
      type: "EARN_PROFIT",
      label: "Earn $1,500 profit",
      difficulty: "Hard",
      target: 150_000,
      rewardCents: REWARD_CENTS.Hard,
    },
    {
      key: "keep-25-active-listings",
      type: "ACTIVE_LISTINGS",
      label: "Keep 25 listings active",
      difficulty: "Hard",
      target: 25,
      rewardCents: REWARD_CENTS.Hard,
    },
    {
      key: "sell-6-categories",
      type: "SELL_CATEGORIES",
      label: "Sell from 6 categories",
      difficulty: "Hard",
      target: 6,
      rewardCents: REWARD_CENTS.Hard,
    },
    {
      key: "complete-10-orders",
      type: "RECEIVE_ORDER",
      label: "Complete 10 orders",
      difficulty: "Hard",
      target: 10,
      rewardCents: REWARD_CENTS.Hard,
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
      return stats.supplierStockBoughtValue;
    case "CART_VALUE":
      return stats.cartValue;
    case "RECEIVE_ORDER":
      return stats.receivedOrders;
    case "ACTIVE_LISTINGS":
      return stats.activeListings;
  }
}

function getProgressLabel(challenge: ChallengeDefinition, progress: number, currencyCode: string) {
  if (
    challenge.type === "EARN_PROFIT" ||
    challenge.type === "CART_VALUE" ||
    challenge.type === "BUY_SUPPLIER_STOCK"
  ) {
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

  if (challenge.type === "BUY_SUPPLIER_STOCK") {
    return `Add ${formatCurrency(challenge.target, currencyCode)} worth of supplier stock`;
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
  let challengeSet = await prisma.challengeSet.upsert({
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

  let challenges = parseChallenges(challengeSet.challenges);
  const generatedKeys = generatedChallenges.map((challenge) => challenge.key).join("|");
  const storedKeys = challenges.map((challenge) => challenge.key).join("|");
  if (storedKeys !== generatedKeys) {
    challengeSet = await prisma.challengeSet.update({
      where: { id: challengeSet.id },
      data: {
        challenges: generatedChallenges,
        rewardedKeys: [],
      },
    });
    challenges = parseChallenges(challengeSet.challenges);
  }

  const rewardedKeys = parseRewardedKeys(challengeSet.rewardedKeys);

  const [
    soldUnitsSummary,
    cartItemsSummary,
    listedProductsCount,
    profitSummary,
    soldCategoryRows,
    supplierStockItems,
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
    getNetProfitSummary({ userId, startAt: cycleStartAt, endAt: cycleEndsAt }),
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
    prisma.cartItem.findMany({
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
      select: {
        quantity: true,
        unitPriceSnapshot: true,
      },
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
    profitEarned: profitSummary.netProfitCents,
    soldCategories: new Set<ProductCategory>(soldCategoryRows.map((row) => row.product.category)).size,
    supplierStockBoughtValue: supplierStockItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPriceSnapshot,
      0,
    ),
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
