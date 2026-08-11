import { randomUUID } from "node:crypto";

import { NotificationType, Prisma } from "@prisma/client";

import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

const STARTING_BALANCE_CENTS = 22_000;
const STARTER_STOCK = [
  { name: "Apples", quantity: 8, cost: 330 },
  { name: "Bread", quantity: 4, cost: 150 },
  { name: "Milk", quantity: 6, cost: 110 },
] as const;

export function validateShopEntry(shopName: string, password: string) {
  const normalizedShopName = shopName.trim().replace(/\s+/g, " ");

  if (normalizedShopName.length < 3 || normalizedShopName.length > 40 || !/[a-z0-9]/i.test(normalizedShopName)) {
    return { success: false as const, error: "Use a shop name with 3 to 40 letters or numbers." };
  }

  if (password.length < 8) {
    return { success: false as const, error: "Use a shop password with at least 8 characters." };
  }

  return { success: true as const, shopName: normalizedShopName, password };
}

export async function createNewPlayerFromShopEntry(shopName: string, password: string) {
  const usernameBase = slugify(shopName) || "shop";
  const internalEmail = `${usernameBase}-${randomUUID()}@players.profitplanet.invalid`;

  try {
    return await prisma.$transaction(async (tx) => {
      const existingShop = await tx.shop.findFirst({
        where: {
          name: {
            equals: shopName,
            mode: "insensitive",
          },
        },
        select: { id: true },
      });

      if (existingShop) {
        throw new Error("That shop name is already being used.");
      }

      const user = await tx.user.create({
        data: {
          email: internalEmail,
          username: usernameBase,
          displayName: shopName,
          passwordHash: hashPassword(password),
          balance: STARTING_BALANCE_CENTS,
          playerMode: "ADVANCED",
          playerModeConfirmed: true,
          hasCompletedOnboarding: true,
        },
      });

      const shop = await tx.shop.create({
        data: {
          ownerId: user.id,
          name: shopName,
          slug: `${usernameBase}-${user.id.slice(-6).toLowerCase()}`,
          description: "A new Profit Planet shop.",
          accentColor: "#2D6A4F",
          logoText: null,
        },
      });

      const starterProducts = await tx.product.findMany({
        where: { name: { in: STARTER_STOCK.map((item) => item.name) } },
        select: { id: true, name: true },
      });
      const productIdsByName = new Map(starterProducts.map((product) => [product.name, product.id]));

      await tx.inventory.createMany({
        data: STARTER_STOCK.flatMap((item) => {
          const productId = productIdsByName.get(item.name);
          return productId
            ? [{ userId: user.id, productId, quantity: item.quantity, averageUnitCost: item.cost }]
            : [];
        }),
      });

      await tx.notification.create({
        data: {
          userId: user.id,
          type: NotificationType.SYSTEM,
          message: `${shop.name} is ready. Buy stock, list it, and start trading.`,
        },
      });

      return { user, shop };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("That shop name is already being used.");
    }
    throw error;
  }
}
