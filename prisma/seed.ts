import {
  MarketTimePhase,
  NotificationType,
  PrismaClient,
  ProductCategory,
} from "@prisma/client";
import { subDays, subHours, subMinutes } from "date-fns";

import {
  CATEGORY_COUNT_EXPECTATIONS,
  INITIAL_BOTS,
  INITIAL_USERS,
  PRODUCT_CATALOG,
} from "../lib/catalog";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();
const shouldReset = process.env.SEED_MODE === "reset";
const SEEDED_ACCOUNT_PASSWORD = "Bazaarly123!";

type CatalogProduct = (typeof PRODUCT_CATALOG)[number];

type ProductRef = {
  id: string;
  name: string;
  sku: string;
  basePrice: number;
  supplierPrice: number;
};

type DemoStockEntry = {
  name: string;
  quantity: number;
  costMultiplier?: number;
};

type DemoListingEntry = {
  name: string;
  quantity: number;
  priceMultiplier?: number;
  active?: boolean;
};

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function toTitleCase(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function unitCost(product: ProductRef, multiplier = 0.74) {
  return Math.max(60, Math.round(product.basePrice * multiplier));
}

function livePrice(product: ProductRef, multiplier = 1.14) {
  return Math.max(product.basePrice, Math.round(product.basePrice * multiplier));
}

function requireProduct(productMap: Map<string, ProductRef>, name: string) {
  const product = productMap.get(name);

  if (!product) {
    throw new Error(`Catalog product missing from seed map: ${name}`);
  }

  return product;
}

async function deleteStaleProducts(currentSkus: string[]) {
  const staleProducts = await prisma.product.findMany({
    where: {
      sku: {
        notIn: currentSkus,
      },
    },
    select: {
      id: true,
      name: true,
      sku: true,
    },
  });

  if (staleProducts.length === 0) {
    return [];
  }

  const staleIds = staleProducts.map((product) => product.id);

  await prisma.orderLineItem.deleteMany({
    where: {
      productId: {
        in: staleIds,
      },
    },
  });

  await prisma.cartItem.deleteMany({
    where: {
      productId: {
        in: staleIds,
      },
    },
  });

  await prisma.listing.deleteMany({
    where: {
      productId: {
        in: staleIds,
      },
    },
  });

  await prisma.inventory.deleteMany({
    where: {
      productId: {
        in: staleIds,
      },
    },
  });

  await prisma.marketEvent.deleteMany({
    where: {
      productId: {
        in: staleIds,
      },
    },
  });

  await prisma.marketProductState.deleteMany({
    where: {
      productId: {
        in: staleIds,
      },
    },
  });

  await prisma.product.deleteMany({
    where: {
      id: {
        in: staleIds,
      },
    },
  });

  return staleProducts;
}

async function main() {
  const existingUsers = await prisma.user.count();
  const existingProducts = await prisma.product.count();
  const shouldSeedDemoWorld = shouldReset || existingUsers === 0;
  const currentSkus = PRODUCT_CATALOG.map((product) => product.sku);

  if (!shouldReset && (existingUsers > 0 || existingProducts > 0)) {
    console.log("Existing world detected. Running catalog replacement sync.");
  }

  if (shouldReset) {
    await prisma.orderLineItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.listing.deleteMany();
    await prisma.inventory.deleteMany();
    await prisma.botCustomer.deleteMany();
    await prisma.marketEvent.deleteMany();
    await prisma.marketProductState.deleteMany();
    await prisma.session.deleteMany();
    await prisma.authThrottle.deleteMany();
    await prisma.shop.deleteMany();
    await prisma.user.deleteMany();
    await prisma.product.deleteMany();
    await prisma.worldState.deleteMany();
  } else {
    const staleProducts = await deleteStaleProducts(currentSkus);
    if (staleProducts.length > 0) {
      console.log(
        `Removed ${staleProducts.length} stale catalog products before syncing the new master list.`,
      );
    }
  }

  const products = new Map<string, ProductRef>();

  for (const product of PRODUCT_CATALOG) {
    const createdProduct = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        category: product.category,
        unitLabel: product.unitLabel,
        description: product.description,
        basePrice: product.basePrice,
        spoilable: product.spoilable,
        shelfLife: product.shelfLife,
        imageUrl: product.imageUrl,
        keywords: product.keywords,
      },
      create: {
        sku: product.sku,
        name: product.name,
        category: product.category,
        unitLabel: product.unitLabel,
        description: product.description,
        basePrice: product.basePrice,
        spoilable: product.spoilable,
        shelfLife: product.shelfLife,
        imageUrl: product.imageUrl,
        keywords: product.keywords,
      },
    });

    products.set(product.name, {
      id: createdProduct.id,
      name: createdProduct.name,
      sku: createdProduct.sku,
      basePrice: product.basePrice,
      supplierPrice: product.supplierPrice,
    });

    await prisma.marketProductState.upsert({
      where: { productId: createdProduct.id },
      update: {
        currentSupplierPrice: product.supplierPrice,
        demandScore: product.demandScore,
        popularityScore: product.popularityScore,
        trendLabel: product.trendLabel,
        supplierStock: shouldSeedDemoWorld
          ? 450
          : {
              increment: 40,
            },
        marketAveragePrice: product.basePrice,
      },
      create: {
        productId: createdProduct.id,
        currentSupplierPrice: product.supplierPrice,
        demandScore: product.demandScore,
        popularityScore: product.popularityScore,
        trendLabel: product.trendLabel,
        supplierStock: 450,
        marketAveragePrice: product.basePrice,
      },
    });
  }

  const users = new Map<
    string,
    { id: string; displayName: string; shopId: string; shopName: string; balance: number }
  >();

  for (const entry of INITIAL_USERS) {
    const user = await prisma.user.upsert({
      where: { username: entry.username },
      update: {
        email: entry.email,
        displayName: entry.displayName,
        hasCompletedOnboarding: true,
        passwordHash: hashPassword(SEEDED_ACCOUNT_PASSWORD),
      },
      create: {
        username: entry.username,
        email: entry.email,
        displayName: entry.displayName,
        passwordHash: hashPassword(SEEDED_ACCOUNT_PASSWORD),
        balance: entry.balance,
        hasCompletedOnboarding: true,
      },
    });

    const shop = await prisma.shop.upsert({
      where: { ownerId: user.id },
      update: {
        name: entry.shop.name,
        slug: entry.shop.slug,
        description: entry.shop.description,
        categoryFocus: entry.shop.categoryFocus,
        accentColor: entry.shop.accentColor,
        rating: entry.shop.rating,
      },
      create: {
        ownerId: user.id,
        name: entry.shop.name,
        slug: entry.shop.slug,
        description: entry.shop.description,
        categoryFocus: entry.shop.categoryFocus,
        accentColor: entry.shop.accentColor,
        rating: entry.shop.rating,
        totalSales: entry.shop.totalSales,
        totalRevenue: entry.shop.totalRevenue,
      },
    });

    users.set(entry.username, {
      id: user.id,
      displayName: user.displayName,
      shopId: shop.id,
      shopName: shop.name,
      balance: user.balance,
    });
  }

  const botWalletUser = await prisma.user.upsert({
    where: { username: "bot_market" },
    update: {
      email: "bot-market@bazaarly.local",
      displayName: "Bazaarly Bot Market",
      hasCompletedOnboarding: true,
      passwordHash: hashPassword(`bot-market-${SEEDED_ACCOUNT_PASSWORD}`),
    },
    create: {
      username: "bot_market",
      email: "bot-market@bazaarly.local",
      displayName: "Bazaarly Bot Market",
      passwordHash: hashPassword(`bot-market-${SEEDED_ACCOUNT_PASSWORD}`),
      balance: 500000,
      hasCompletedOnboarding: true,
    },
  });

  const botWalletShop = await prisma.shop.upsert({
    where: { ownerId: botWalletUser.id },
    update: {
      name: "Bazaarly Bot Ledger",
      slug: "bazaarly-bot-ledger",
      description: "Internal wallet for automated marketplace customers.",
      accentColor: "#6B7280",
      status: "INACTIVE",
      rating: 5,
    },
    create: {
      ownerId: botWalletUser.id,
      name: "Bazaarly Bot Ledger",
      slug: "bazaarly-bot-ledger",
      description: "Internal wallet for automated marketplace customers.",
      accentColor: "#6B7280",
      status: "INACTIVE",
      rating: 5,
    },
  });

  users.set("bot_market", {
    id: botWalletUser.id,
    displayName: botWalletUser.displayName,
    shopId: botWalletShop.id,
    shopName: botWalletShop.name,
    balance: botWalletUser.balance,
  });

  const demoInventorySeed: Record<string, DemoStockEntry[]> = {
    avery: [
      { name: "Apples", quantity: 42 },
      { name: "Bananas", quantity: 34 },
      { name: "Bread", quantity: 18 },
      { name: "Eggs", quantity: 16 },
      { name: "Lamb", quantity: 12 },
      { name: "Spinach", quantity: 16 },
      { name: "Tomatoes", quantity: 20 },
      { name: "Onions", quantity: 22 },
      { name: "Broccoli", quantity: 12 },
    ],
    jordan: [
      { name: "Water", quantity: 50 },
      { name: "Juice", quantity: 24 },
      { name: "Soda", quantity: 26 },
      { name: "Chips", quantity: 30 },
      { name: "Tea", quantity: 16 },
      { name: "Coffee", quantity: 12 },
      { name: "Rice", quantity: 16 },
      { name: "Chocolate", quantity: 24 },
    ],
    mia: [
      { name: "Knives", quantity: 12, costMultiplier: 0.7 },
      { name: "Cutting Board", quantity: 12, costMultiplier: 0.7 },
      { name: "Pans", quantity: 8, costMultiplier: 0.72 },
      { name: "Pots", quantity: 6, costMultiplier: 0.72 },
      { name: "Measuring Cups", quantity: 12, costMultiplier: 0.7 },
      { name: "Storage Boxes", quantity: 8, costMultiplier: 0.72 },
      { name: "Towels", quantity: 10, costMultiplier: 0.7 },
      { name: "Hangers", quantity: 14, costMultiplier: 0.7 },
    ],
    noah: [
      { name: "T-Shirts", quantity: 18 },
      { name: "Socks", quantity: 22 },
      { name: "Toothpaste", quantity: 20 },
      { name: "Shampoo", quantity: 16 },
      { name: "Detergent", quantity: 10 },
      { name: "Hats", quantity: 6 },
      { name: "Deodorant", quantity: 12 },
      { name: "Backpack", quantity: 10 },
    ],
  };

  const demoListingSeed: Record<string, DemoListingEntry[]> = {
    avery: [
      { name: "Apples", quantity: 18 },
      { name: "Bananas", quantity: 14 },
      { name: "Bread", quantity: 8 },
      { name: "Eggs", quantity: 6 },
      { name: "Lamb", quantity: 4, priceMultiplier: 1.1 },
      { name: "Spinach", quantity: 10 },
      { name: "Broccoli", quantity: 6 },
    ],
    jordan: [
      { name: "Water", quantity: 20 },
      { name: "Juice", quantity: 10 },
      { name: "Soda", quantity: 12 },
      { name: "Chips", quantity: 14 },
      { name: "Coffee", quantity: 6, priceMultiplier: 1.12 },
      { name: "Chocolate", quantity: 12 },
    ],
    mia: [
      { name: "Knives", quantity: 5, priceMultiplier: 1.16 },
      { name: "Cutting Board", quantity: 6, priceMultiplier: 1.15 },
      { name: "Pans", quantity: 4, priceMultiplier: 1.15 },
      { name: "Storage Boxes", quantity: 6, priceMultiplier: 1.14 },
      { name: "Towels", quantity: 4, priceMultiplier: 1.12 },
    ],
    noah: [
      { name: "T-Shirts", quantity: 7, priceMultiplier: 1.18 },
      { name: "Socks", quantity: 12, priceMultiplier: 1.18 },
      { name: "Toothpaste", quantity: 8, priceMultiplier: 1.12 },
      { name: "Shampoo", quantity: 8, priceMultiplier: 1.12 },
      { name: "Backpack", quantity: 3, priceMultiplier: 1.1 },
    ],
  };

  const listings = new Map<string, string>();

  if (shouldSeedDemoWorld) {
    for (const [username, items] of Object.entries(demoInventorySeed)) {
      const user = users.get(username);
      if (!user) continue;

      for (const item of items) {
        const product = requireProduct(products, item.name);

        await prisma.inventory.upsert({
          where: {
            userId_productId: {
              userId: user.id,
              productId: product.id,
            },
          },
          update: {
            quantity: item.quantity,
            allocatedQuantity: 0,
            averageUnitCost: unitCost(product, item.costMultiplier),
          },
          create: {
            userId: user.id,
            productId: product.id,
            quantity: item.quantity,
            averageUnitCost: unitCost(product, item.costMultiplier),
          },
        });
      }
    }

    for (const [username, shopListings] of Object.entries(demoListingSeed)) {
      const user = users.get(username);
      if (!user) continue;

      for (const item of shopListings) {
        const product = requireProduct(products, item.name);
        const price = livePrice(product, item.priceMultiplier);

        const listing = await prisma.listing.upsert({
          where: {
            shopId_productId: {
              shopId: user.shopId,
              productId: product.id,
            },
          },
          update: {
            price,
            quantity: item.quantity,
            active: item.active ?? true,
          },
          create: {
            shopId: user.shopId,
            productId: product.id,
            price,
            quantity: item.quantity,
            active: item.active ?? true,
          },
        });

        listings.set(`${username}:${item.name}`, listing.id);

        await prisma.inventory.update({
          where: {
            userId_productId: {
              userId: user.id,
              productId: product.id,
            },
          },
          data: {
            allocatedQuantity: item.quantity,
          },
        });
      }
    }

    const sampleOrders = [
      {
        buyer: "jordan",
        seller: "avery",
        hoursAgo: 10,
        items: [
          { name: "Apples", quantity: 3, listingKey: "avery:Apples" },
          { name: "Bread", quantity: 1, listingKey: "avery:Bread" },
        ],
      },
      {
        buyer: "avery",
        seller: "jordan",
        hoursAgo: 6,
        items: [
          { name: "Water", quantity: 2, listingKey: "jordan:Water" },
          { name: "Juice", quantity: 1, listingKey: "jordan:Juice" },
        ],
      },
      {
        buyer: "mia",
        seller: "noah",
        hoursAgo: 3,
        items: [
          { name: "Socks", quantity: 2, listingKey: "noah:Socks" },
          { name: "Toothpaste", quantity: 1, listingKey: "noah:Toothpaste" },
        ],
      },
    ];

    for (const orderSeed of sampleOrders) {
      const buyer = users.get(orderSeed.buyer);
      const seller = users.get(orderSeed.seller);
      if (!buyer || !seller) continue;

      const lineItems = orderSeed.items.map((item) => {
        const product = requireProduct(products, item.name);
        const listingId = listings.get(item.listingKey);
        const listing = demoListingSeed[orderSeed.seller]
          .map((entry) => ({
            ...entry,
            product,
          }))
          .find((entry) => entry.name === item.name);

        if (!listing || !listingId) {
          throw new Error(`Demo listing missing for ${item.name}`);
        }

        const unitPrice = livePrice(product, listing.priceMultiplier);

        return {
          product,
          listingId,
          quantity: item.quantity,
          unitPrice,
        };
      });

      const totalPrice = lineItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      );

      const order = await prisma.order.create({
        data: {
          buyerId: buyer.id,
          sellerId: seller.id,
          shopId: seller.shopId,
          totalPrice,
          createdAt: subHours(new Date(), orderSeed.hoursAgo),
        },
      });

      for (const item of lineItems) {
        await prisma.orderLineItem.create({
          data: {
            orderId: order.id,
            productId: item.product.id,
            listingId: item.listingId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.unitPrice * item.quantity,
            createdAt: subHours(new Date(), orderSeed.hoursAgo),
          },
        });
      }

      const summary = lineItems
        .map((item) => `${item.quantity}x ${toTitleCase(item.product.name)}`)
        .join(", ");

      await prisma.notification.create({
        data: {
          userId: seller.id,
          type: NotificationType.SALE,
          message: `${buyer.displayName} bought ${summary} for $${(totalPrice / 100).toFixed(2)}.`,
          createdAt: subHours(new Date(), orderSeed.hoursAgo),
        },
      });
    }

    await prisma.notification.createMany({
      data: [
        {
          userId: users.get("avery")!.id,
          type: NotificationType.LOW_STOCK,
          message: "Your Eggs listing is running low. Only 6 left in your live stock.",
          createdAt: subHours(new Date(), 2),
        },
        {
          userId: users.get("jordan")!.id,
          type: NotificationType.MARKET,
          message: "Heatwave event is active. Drinks demand is up across Bazaarly.",
          createdAt: subHours(new Date(), 1),
        },
        {
          userId: users.get("mia")!.id,
          type: NotificationType.SYSTEM,
          message:
            "Kitchen and dining shoppers are browsing more this afternoon. Consider adjusting prices or restocking.",
          createdAt: subMinutes(new Date(), 40),
        },
      ],
      skipDuplicates: true,
    });
  }

  await prisma.marketEvent.upsert({
    where: { slug: "heatwave" },
    update: {
      description: "Warm weather has pushed drink demand higher across the marketplace.",
      effectType: "CATEGORY_DEMAND",
      effectValue: 1.22,
      active: true,
      startsAt: subDays(new Date(), 1),
      endsAt: subDays(new Date(), -2),
      category: ProductCategory.DRINKS,
    },
    create: {
      name: "Heatwave",
      slug: "heatwave",
      description: "Warm weather has pushed drink demand higher across the marketplace.",
      effectType: "CATEGORY_DEMAND",
      effectValue: 1.22,
      active: true,
      startsAt: subDays(new Date(), 1),
      endsAt: subDays(new Date(), -2),
      category: ProductCategory.DRINKS,
    },
  });

  if (shouldSeedDemoWorld) {
    await prisma.worldState.upsert({
      where: { id: "global" },
      update: {
        currentDay: 14,
        currentPhase: MarketTimePhase.AFTERNOON,
        lastSimulatedAt: subHours(new Date(), 1),
      },
      create: {
        id: "global",
        currentDay: 14,
        currentPhase: MarketTimePhase.AFTERNOON,
        lastSimulatedAt: subHours(new Date(), 1),
      },
    });
  } else {
    await prisma.worldState.upsert({
      where: { id: "global" },
      update: {},
      create: {
        id: "global",
      },
    });
  }

  for (const bot of INITIAL_BOTS) {
    await prisma.botCustomer.upsert({
      where: { displayName: bot.displayName },
      update: {
        type: bot.type,
        budget: bot.budget,
        preferenceCategory: bot.preferenceCategory,
        loyaltyShopId: null,
        activityLevel: bot.activityLevel,
        active: true,
      },
      create: {
        displayName: bot.displayName,
        type: bot.type,
        budget: bot.budget,
        preferenceCategory: bot.preferenceCategory,
        loyaltyShopId: null,
        activityLevel: bot.activityLevel,
        lastPurchasedAt: subHours(new Date(), Math.floor(Math.random() * 9) + 1),
      },
    });
  }

  for (const product of PRODUCT_CATALOG) {
    const productRef = requireProduct(products, product.name);
    const relatedListings = await prisma.listing.findMany({
      where: { productId: productRef.id },
      select: { price: true },
    });

    await prisma.marketProductState.update({
      where: { productId: productRef.id },
      data: {
        marketAveragePrice:
          relatedListings.length > 0
            ? average(relatedListings.map((listing) => listing.price))
            : product.basePrice,
      },
    });
  }

  const insertedProducts = await prisma.product.findMany({
    select: {
      name: true,
      sku: true,
      category: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const catalogNameSet = new Set(PRODUCT_CATALOG.map((product) => product.name));
  const catalogSkuSet = new Set(PRODUCT_CATALOG.map((product) => product.sku));
  const insertedNameSet = new Set(insertedProducts.map((product) => product.name));
  const actualCounts = insertedProducts.reduce<Record<string, number>>((counts, product) => {
    counts[product.category] = (counts[product.category] ?? 0) + 1;
    return counts;
  }, {});
  const missingItems = PRODUCT_CATALOG.filter((product) => !insertedNameSet.has(product.name)).map(
    (product) => product.name,
  );
  const duplicateItems = insertedProducts.reduce<string[]>((duplicates, product, index, items) => {
    if (items.findIndex((item) => item.name === product.name) !== index) {
      duplicates.push(product.name);
    }
    return duplicates;
  }, []);
  const staleProductsAfterSync = insertedProducts.filter((product) => !catalogSkuSet.has(product.sku));

  console.log("Catalog audit:");
  for (const [category, expectedCount] of Object.entries(CATEGORY_COUNT_EXPECTATIONS)) {
    console.log(
      `- ${category}: expected ${expectedCount}, actual ${actualCounts[category] ?? 0}`,
    );
  }
  console.log(`- total expected: ${PRODUCT_CATALOG.length}`);
  console.log(`- total actual: ${insertedProducts.length}`);
  console.log(`- missing items: ${missingItems.length ? missingItems.join(", ") : "none"}`);
  console.log(`- duplicate items: ${duplicateItems.length ? duplicateItems.join(", ") : "none"}`);
  console.log(
    `- old products fully removed: ${staleProductsAfterSync.length === 0 ? "yes" : "no"}`,
  );
  if (staleProductsAfterSync.length > 0) {
    console.log(
      `- stale products still present: ${staleProductsAfterSync
        .map((product) => `${product.name} (${product.sku})`)
        .join(", ")}`,
    );
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
