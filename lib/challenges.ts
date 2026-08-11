import { createHash } from "node:crypto";

import { Prisma, ProductCategory } from "@prisma/client";

import { getNetProfitSummary } from "@/lib/business-ledger";
import { formatCurrency } from "@/lib/money";
import {
  getPlayerModeConfig,
  getPlayerModeProfitChallengeLabel,
  normalizePlayerMode,
  type PlayerMode,
} from "@/lib/player-mode";
import { prisma } from "@/lib/prisma";

export const CHALLENGE_CYCLE_MS = 24 * 60 * 60 * 1000;

export type ChallengeDifficulty = "Very Easy" | "Easy" | "Medium" | "Hard" | "Extra Hard";
type ChallengeLibrary = Record<"Easy" | "Medium" | "Hard", ChallengeDefinition[]> &
  Partial<Record<ChallengeDifficulty, ChallengeDefinition[]>>;

export type ChallengeDefinition = {
  key: string;
  type:
    | "SELL_ITEMS"
    | "ADD_CART_ITEMS"
    | "LIST_PRODUCTS"
    | "RESTOCK_SOLD_OUT"
    | "EARN_PROFIT"
    | "EARN_REVENUE"
    | "SELL_CATEGORIES"
    | "BUY_SUPPLIER_STOCK"
    | "CART_VALUE"
    | "RECEIVE_ORDER"
    | "ACTIVE_LISTINGS";
  label: string;
  difficulty: ChallengeDifficulty;
  target: number;
  rewardCents: number;
  rewardXp?: number;
};

export type ChallengeView = ChallengeDefinition & {
  progress: number;
  progressLabel: string;
  rewardLabel: string;
  rewardXp: number;
  completed: boolean;
  rewarded: boolean;
  ratio: number;
};

export type ChallengeStage = "Beginner" | "Growing" | "Established" | "Big Shop" | "Tycoon";

type ChallengeStats = {
  soldItems: number;
  cartItemsAdded: number;
  listedProducts: number;
  restockedItems: number;
  profitEarned: number;
  salesRevenue: number;
  soldCategories: number;
  supplierStockBoughtValue: number;
  cartValue: number;
  receivedOrders: number;
  activeListings: number;
};

const REWARD_CENTS: Record<ChallengeDifficulty, number> = {
  "Very Easy": 1_000,
  Easy: 2_000,
  Medium: 5_000,
  Hard: 7_500,
  "Extra Hard": 10_000,
};

const REWARD_XP: Record<ChallengeDifficulty, number> = {
  "Very Easy": 10,
  Easy: 20,
  Medium: 50,
  Hard: 75,
  "Extra Hard": 100,
};

function getChallengeXpReward(challenge: Pick<ChallengeDefinition, "difficulty" | "rewardXp">) {
  return challenge.rewardXp ?? REWARD_XP[challenge.difficulty];
}

const BEGINNER_CHALLENGES: ChallengeDefinition[] = [
  {
    key: "beginner-list-1-product",
    type: "LIST_PRODUCTS",
    label: "Put 1 item in your shop",
    difficulty: "Very Easy",
    target: 1,
    rewardCents: 1_000,
    rewardXp: 10,
  },
  {
    key: "beginner-sell-50-stock",
    type: "EARN_REVENUE",
    label: "Sell stock target",
    difficulty: "Easy",
    target: 5_000,
    rewardCents: 2_000,
    rewardXp: 20,
  },
  {
    key: "beginner-list-5-products",
    type: "LIST_PRODUCTS",
    label: "Put 5 items in your shop",
    difficulty: "Medium",
    target: 5,
    rewardCents: 5_000,
    rewardXp: 50,
  },
  {
    key: "beginner-sell-50-items",
    type: "SELL_ITEMS",
    label: "Sell 50 items",
    difficulty: "Hard",
    target: 50,
    rewardCents: 7_500,
    rewardXp: 75,
  },
  {
    key: "beginner-sell-100-items",
    type: "SELL_ITEMS",
    label: "Sell 100 items",
    difficulty: "Extra Hard",
    target: 100,
    rewardCents: 10_000,
    rewardXp: 100,
  },
];

const ADVANCED_CHALLENGE_LIBRARY: ChallengeLibrary = {
  "Very Easy": [
    { key: "list-1-product", type: "LIST_PRODUCTS", label: "List 1 product", difficulty: "Very Easy", target: 1, rewardCents: REWARD_CENTS["Very Easy"] },
  ],
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
      label: "Earn profit target",
      difficulty: "Easy",
      target: 15_000,
      rewardCents: REWARD_CENTS.Easy,
    },
    {
      key: "buy-150-supplier-stock",
      type: "BUY_SUPPLIER_STOCK",
      label: "Add supplier stock target",
      difficulty: "Easy",
      target: 15_000,
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
      key: "restock-3-sold-out-items",
      type: "RESTOCK_SOLD_OUT",
      label: "Restock 3 sold-out items",
      difficulty: "Easy",
      target: 3,
      rewardCents: REWARD_CENTS.Easy,
    },
    {
      key: "complete-2-orders",
      type: "RECEIVE_ORDER",
      label: "Complete 2 orders",
      difficulty: "Easy",
      target: 2,
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
      label: "Earn profit target",
      difficulty: "Medium",
      target: 50_000,
      rewardCents: REWARD_CENTS.Medium,
    },
    {
      key: "restock-6-sold-out-items",
      type: "RESTOCK_SOLD_OUT",
      label: "Restock 6 sold-out items",
      difficulty: "Medium",
      target: 6,
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
      key: "sell-50-items",
      type: "SELL_ITEMS",
      label: "Sell 50 items",
      difficulty: "Hard",
      target: 50,
      rewardCents: REWARD_CENTS.Hard,
    },
    {
      key: "earn-1500-profit",
      type: "EARN_PROFIT",
      label: "Earn profit target",
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
    {
      key: "restock-12-sold-out-items",
      type: "RESTOCK_SOLD_OUT",
      label: "Restock 12 sold-out items",
      difficulty: "Hard",
      target: 12,
      rewardCents: REWARD_CENTS.Hard,
    },
  ],
  "Extra Hard": [
    { key: "sell-100-items", type: "SELL_ITEMS", label: "Sell 100 items", difficulty: "Extra Hard", target: 100, rewardCents: REWARD_CENTS["Extra Hard"] },
    { key: "earn-3000-profit", type: "EARN_PROFIT", label: "Earn profit target", difficulty: "Extra Hard", target: 300_000, rewardCents: REWARD_CENTS["Extra Hard"] },
  ],
};

const JUNIOR_CHALLENGE_LIBRARY: ChallengeLibrary = {
  Easy: [
    { key: "junior-sell-5-items", type: "SELL_ITEMS", label: "Sell 5 items", difficulty: "Easy", target: 5, rewardCents: REWARD_CENTS.Easy },
    { key: "junior-buy-150-stock", type: "BUY_SUPPLIER_STOCK", label: "Buy stock target", difficulty: "Easy", target: 15_000, rewardCents: REWARD_CENTS.Easy },
    { key: "junior-keep-5-for-sale", type: "ACTIVE_LISTINGS", label: "Keep 5 items for sale", difficulty: "Easy", target: 5, rewardCents: REWARD_CENTS.Easy },
    { key: "junior-list-4-products", type: "LIST_PRODUCTS", label: "Put 4 items in your shop", difficulty: "Easy", target: 4, rewardCents: REWARD_CENTS.Easy },
  ],
  Medium: [
    { key: "junior-sell-10-items", type: "SELL_ITEMS", label: "Sell 10 items", difficulty: "Medium", target: 10, rewardCents: REWARD_CENTS.Medium },
    { key: "junior-earn-250-profit", type: "EARN_PROFIT", label: "Earn profit target", difficulty: "Medium", target: 25_000, rewardCents: REWARD_CENTS.Medium },
    { key: "junior-restock-4-items", type: "RESTOCK_SOLD_OUT", label: "Buy more stock for 4 sold-out items", difficulty: "Medium", target: 4, rewardCents: REWARD_CENTS.Medium },
    { key: "junior-sell-3-categories", type: "SELL_CATEGORIES", label: "Sell from 3 groups", difficulty: "Medium", target: 3, rewardCents: REWARD_CENTS.Medium },
  ],
  Hard: [
    { key: "junior-sell-18-items", type: "SELL_ITEMS", label: "Sell 18 items", difficulty: "Hard", target: 18, rewardCents: REWARD_CENTS.Hard },
    { key: "junior-complete-7-orders", type: "RECEIVE_ORDER", label: "Complete 7 sales", difficulty: "Hard", target: 7, rewardCents: REWARD_CENTS.Hard },
    { key: "junior-keep-12-for-sale", type: "ACTIVE_LISTINGS", label: "Keep 12 items for sale", difficulty: "Hard", target: 12, rewardCents: REWARD_CENTS.Hard },
  ],
};

const YOUNG_CHALLENGE_LIBRARY: ChallengeLibrary = {
  Easy: [
    { key: "young-sell-8-items", type: "SELL_ITEMS", label: "Sell 8 items", difficulty: "Easy", target: 8, rewardCents: REWARD_CENTS.Easy },
    { key: "young-buy-150-stock", type: "BUY_SUPPLIER_STOCK", label: "Buy stock target", difficulty: "Easy", target: 15_000, rewardCents: REWARD_CENTS.Easy },
    { key: "young-keep-8-for-sale", type: "ACTIVE_LISTINGS", label: "Keep 8 items for sale", difficulty: "Easy", target: 8, rewardCents: REWARD_CENTS.Easy },
    { key: "young-list-6-products", type: "LIST_PRODUCTS", label: "Put 6 items in your shop", difficulty: "Easy", target: 6, rewardCents: REWARD_CENTS.Easy },
  ],
  Medium: [
    { key: "young-sell-16-items", type: "SELL_ITEMS", label: "Sell 16 items", difficulty: "Medium", target: 16, rewardCents: REWARD_CENTS.Medium },
    { key: "young-earn-400-profit", type: "EARN_PROFIT", label: "Profit after costs target", difficulty: "Medium", target: 40_000, rewardCents: REWARD_CENTS.Medium },
    { key: "young-restock-6-items", type: "RESTOCK_SOLD_OUT", label: "Buy more stock for 6 sold-out items", difficulty: "Medium", target: 6, rewardCents: REWARD_CENTS.Medium },
    { key: "young-sell-4-categories", type: "SELL_CATEGORIES", label: "Sell from 4 groups", difficulty: "Medium", target: 4, rewardCents: REWARD_CENTS.Medium },
  ],
  Hard: [
    { key: "young-sell-25-items", type: "SELL_ITEMS", label: "Sell 25 items", difficulty: "Hard", target: 25, rewardCents: REWARD_CENTS.Hard },
    { key: "young-earn-900-profit", type: "EARN_PROFIT", label: "Profit after costs target", difficulty: "Hard", target: 90_000, rewardCents: REWARD_CENTS.Hard },
    { key: "young-keep-18-for-sale", type: "ACTIVE_LISTINGS", label: "Keep 18 items for sale", difficulty: "Hard", target: 18, rewardCents: REWARD_CENTS.Hard },
  ],
};

const LITTLE_CHALLENGE_LIBRARY: ChallengeLibrary = {
  Easy: [
    { key: "little-sell-2-things", type: "SELL_ITEMS", label: "Sell 2 things", difficulty: "Easy", target: 2, rewardCents: REWARD_CENTS.Easy },
    { key: "little-buy-1-item", type: "ADD_CART_ITEMS", label: "Pick 1 thing to buy", difficulty: "Easy", target: 1, rewardCents: REWARD_CENTS.Easy },
    { key: "little-put-1-in-shop", type: "LIST_PRODUCTS", label: "Put 1 thing in your shop", difficulty: "Easy", target: 1, rewardCents: REWARD_CENTS.Easy },
    { key: "little-keep-1-for-sale", type: "ACTIVE_LISTINGS", label: "Keep 1 thing for sale", difficulty: "Easy", target: 1, rewardCents: REWARD_CENTS.Easy },
  ],
  Medium: [
    { key: "little-sell-3-things", type: "SELL_ITEMS", label: "Sell 3 things", difficulty: "Medium", target: 3, rewardCents: REWARD_CENTS.Medium },
    { key: "little-buy-more-stock", type: "BUY_SUPPLIER_STOCK", label: "Buy more stock", difficulty: "Medium", target: 5_000, rewardCents: REWARD_CENTS.Medium },
    { key: "little-fix-1-sold-out", type: "RESTOCK_SOLD_OUT", label: "Buy more for 1 sold-out thing", difficulty: "Medium", target: 1, rewardCents: REWARD_CENTS.Medium },
  ],
  Hard: [
    { key: "little-sell-5-things", type: "SELL_ITEMS", label: "Sell 5 things", difficulty: "Hard", target: 5, rewardCents: REWARD_CENTS.Hard },
    { key: "little-finish-2-sales", type: "RECEIVE_ORDER", label: "Finish 2 sales", difficulty: "Hard", target: 2, rewardCents: REWARD_CENTS.Hard },
    { key: "little-keep-3-for-sale", type: "ACTIVE_LISTINGS", label: "Keep 3 things in your shop", difficulty: "Hard", target: 3, rewardCents: REWARD_CENTS.Hard },
  ],
};

function getChallengeLibrary(playerMode: PlayerMode) {
  if (playerMode === "LITTLE") return LITTLE_CHALLENGE_LIBRARY;
  if (playerMode === "JUNIOR") return JUNIOR_CHALLENGE_LIBRARY;
  if (playerMode === "YOUNG") return YOUNG_CHALLENGE_LIBRARY;
  return ADVANCED_CHALLENGE_LIBRARY;
}

const DIFFICULTY_ORDER: ChallengeDifficulty[] = ["Very Easy", "Easy", "Medium", "Hard", "Extra Hard"];

const STAGE_SCALE: Record<ChallengeStage, { count: number; money: number }> = {
  Beginner: { count: 1, money: 1 },
  Growing: { count: 1.6, money: 1.8 },
  Established: { count: 2.4, money: 3 },
  "Big Shop": { count: 3.6, money: 5 },
  Tycoon: { count: 5, money: 8 },
};

function getChallengeStage({
  balance,
  totalOrders,
  activeListingCount,
  inventoryCount,
  categoriesStocked,
  totalNetProfit,
}: {
  balance: number;
  totalOrders: number;
  activeListingCount: number;
  inventoryCount: number;
  categoriesStocked: number;
  totalNetProfit: number;
}): ChallengeStage {
  const score =
    (balance >= 500_000 ? 2 : balance >= 150_000 ? 1 : 0) +
    (totalOrders >= 40 ? 3 : totalOrders >= 15 ? 2 : totalOrders >= 5 ? 1 : 0) +
    (activeListingCount >= 25 ? 3 : activeListingCount >= 12 ? 2 : activeListingCount >= 5 ? 1 : 0) +
    (inventoryCount >= 35 ? 2 : inventoryCount >= 15 ? 1 : 0) +
    (categoriesStocked >= 8 ? 2 : categoriesStocked >= 4 ? 1 : 0) +
    (totalNetProfit >= 300_000 ? 3 : totalNetProfit >= 100_000 ? 2 : totalNetProfit >= 25_000 ? 1 : 0);

  if (score >= 12) return "Tycoon";
  if (score >= 9) return "Big Shop";
  if (score >= 6) return "Established";
  if (score >= 3) return "Growing";
  return "Beginner";
}

function scaleChallengeForStage(
  challenge: ChallengeDefinition,
  stage: ChallengeStage,
  playerMode: PlayerMode,
): ChallengeDefinition {
  if (playerMode === "LITTLE") {
    return {
      ...challenge,
      key: `${challenge.key}:mode-little`,
    };
  }

  const scale = STAGE_SCALE[stage];
  const modeScale = playerMode === "JUNIOR" ? 0.7 : playerMode === "YOUNG" ? 0.85 : 1;
  const isMoneyTarget =
    challenge.type === "EARN_PROFIT" ||
    challenge.type === "BUY_SUPPLIER_STOCK" ||
    challenge.type === "CART_VALUE";
  const targetScale = isMoneyTarget ? scale.money : scale.count;
  const scaledTarget = challenge.target * targetScale * modeScale;
  const rounding = isMoneyTarget ? 5_000 : 5;
  const target = Math.max(challenge.target, Math.ceil(scaledTarget / rounding) * rounding);

  return {
    ...challenge,
    key: `${challenge.key}:mode-${playerMode.toLowerCase()}:stage-${stage.toLowerCase().replace(/\s+/g, "-")}`,
    target,
  };
}

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

function generateChallenges(userId: string, cycleStartAt: Date, stage: ChallengeStage, playerMode: PlayerMode) {
  if (stage === "Beginner") {
    return BEGINNER_CHALLENGES.map((challenge) => ({
      ...challenge,
      key: `${challenge.key}:${cycleStartAt.toISOString()}`,
    }));
  }

  const cycleKey = cycleStartAt.toISOString();
  const usedBaseKeys = new Set<string>();
  const challengeLibrary = getChallengeLibrary(playerMode);
  return DIFFICULTY_ORDER.map((difficulty, slot) => {
    const options = challengeLibrary[difficulty] ?? challengeLibrary.Hard;
    const startIndex = getSeedIndex(`${userId}:${cycleKey}:${playerMode}:${difficulty}:${slot}`, options.length);
    let selected = options[startIndex];

    for (let offset = 0; offset < options.length; offset += 1) {
      const option = options[(startIndex + offset) % options.length];
      if (!usedBaseKeys.has(option.key)) {
        selected = option;
        break;
      }
    }

    usedBaseKeys.add(selected.key);
    return scaleChallengeForStage({
      ...selected,
      key: `${selected.key}:${cycleKey}`,
    }, stage, playerMode);
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

function getChallengeDefinitionFingerprint(challenges: ChallengeDefinition[]) {
  return challenges
    .map((challenge) =>
      [
        challenge.key,
        challenge.type,
        challenge.label,
        challenge.difficulty,
        challenge.target,
        challenge.rewardCents,
        getChallengeXpReward(challenge),
      ].join(":"),
    )
    .join("|");
}

function getChallengeProgress(challenge: ChallengeDefinition, stats: ChallengeStats) {
  switch (challenge.type) {
    case "SELL_ITEMS":
      return stats.soldItems;
    case "ADD_CART_ITEMS":
      return stats.cartItemsAdded;
    case "LIST_PRODUCTS":
      return stats.listedProducts;
    case "RESTOCK_SOLD_OUT":
      return stats.restockedItems;
    case "EARN_PROFIT":
      return stats.profitEarned;
    case "EARN_REVENUE":
      return stats.salesRevenue;
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
    challenge.type === "EARN_REVENUE" ||
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

function getChallengeLabel(challenge: ChallengeDefinition, currencyCode: string, playerMode: PlayerMode) {
  if (challenge.type === "EARN_PROFIT") {
    return getPlayerModeProfitChallengeLabel(
      playerMode,
      formatCurrency(challenge.target, currencyCode),
    );
  }

  if (challenge.type === "EARN_REVENUE") {
    return `Sell ${formatCurrency(challenge.target, currencyCode)} of stock`;
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
  playerMode: requestedPlayerMode,
}: {
  userId: string;
  shopId: string;
  currencyCode: string;
  activeListingCount: number;
  now?: Date;
  playerMode?: PlayerMode;
}) {
  const cycleStartAt = getCycleStart(now);
  const cycleEndsAt = getCycleEnd(cycleStartAt);
  const [totalProfitSummary, totalOrderCount, inventoryStageRows, stageUser] = await Promise.all([
    getNetProfitSummary({ userId }),
    prisma.order.count({ where: { sellerId: userId } }),
    prisma.inventory.findMany({
      where: { userId, quantity: { gt: 0 } },
      select: {
        product: {
          select: {
            category: true,
          },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    }),
  ]);
  const playerMode = normalizePlayerMode(requestedPlayerMode);
  const playerModeConfig = getPlayerModeConfig(playerMode);
  const stage = getChallengeStage({
    balance: stageUser?.balance ?? 0,
    totalOrders: totalOrderCount,
    activeListingCount,
    inventoryCount: inventoryStageRows.length,
    categoriesStocked: new Set<ProductCategory>(inventoryStageRows.map((row) => row.product.category)).size,
    totalNetProfit: totalProfitSummary.netProfitCents,
  });
  const generatedChallenges = generateChallenges(userId, cycleStartAt, stage, playerMode);
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
  if (getChallengeDefinitionFingerprint(challenges) !== getChallengeDefinitionFingerprint(generatedChallenges)) {
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
      _sum: { quantity: true, lineTotal: true },
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
    salesRevenue: soldUnitsSummary._sum.lineTotal ?? 0,
    cartItemsAdded: cartItemsSummary._sum.quantity ?? 0,
    listedProducts: listedProductsCount,
    restockedItems: supplierStockItems.reduce((sum, item) => sum + item.quantity, 0),
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
      label: getChallengeLabel(challenge, currencyCode, playerMode),
      progress,
      progressLabel: getProgressLabel(challenge, progress, currencyCode),
      rewardLabel: formatCurrency(challenge.rewardCents, currencyCode),
      rewardXp: getChallengeXpReward(challenge),
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
      const freshXpReward = freshNew.reduce((sum, challenge) => sum + challenge.rewardXp, 0);

      await tx.user.update({
        where: { id: userId },
        data: {
          balance: {
            increment: freshRewardTotal,
          },
          xp: {
            increment: freshXpReward,
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
          message: `Challenge reward earned: ${formatCurrency(freshRewardTotal, currencyCode)} and ${freshXpReward} XP.`,
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
    stage,
    playerMode,
    playerModeLabel: playerModeConfig.shortLabel,
    secondsRemaining: Math.max(0, Math.ceil((cycleEndsAt.getTime() - now.getTime()) / 1000)),
    challenges: challengeViews,
  };
}
