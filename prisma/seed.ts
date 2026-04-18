import {
  PrismaClient,
  ProductCategory,
  NotificationType,
  MarketTimePhase,
} from "@prisma/client";
import { subDays, subHours, subMinutes } from "date-fns";

import { INITIAL_BOTS, INITIAL_USERS, PRODUCT_CATALOG } from "../lib/catalog";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();
const shouldReset = process.env.SEED_MODE === "reset";
const SEEDED_ACCOUNT_PASSWORD = "Bazaarly123!";

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

async function main() {
  const existingUsers = await prisma.user.count();
  const existingProducts = await prisma.product.count();

  if (!shouldReset && (existingUsers > 0 || existingProducts > 0)) {
    console.log("Existing world detected. Running additive catalog sync.");
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
    await prisma.shop.deleteMany();
    await prisma.user.deleteMany();
    await prisma.product.deleteMany();
    await prisma.worldState.deleteMany();
  }

  const products = new Map<string, { id: string; basePrice: number }>();

  for (const product of PRODUCT_CATALOG) {
    const createdProduct = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        category: product.category,
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
        description: product.description,
        basePrice: product.basePrice,
        spoilable: product.spoilable,
        shelfLife: product.shelfLife,
        imageUrl: product.imageUrl,
        keywords: product.keywords,
      },
    });

    products.set(product.name, { id: createdProduct.id, basePrice: product.basePrice });

    await prisma.marketProductState.upsert({
      where: { productId: createdProduct.id },
      update: {
        currentSupplierPrice: product.supplierPrice,
        demandScore: product.demandScore,
        popularityScore: product.popularityScore,
        trendLabel: product.trendLabel,
        supplierStock: {
          increment: 60,
        },
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

  const inventorySeed: Record<string, Array<{ product: string; quantity: number; cost: number }>> = {
    avery: [
      { product: "Apples", quantity: 40, cost: 110 },
      { product: "Bananas", quantity: 34, cost: 90 },
      { product: "White Bread Loaf", quantity: 20, cost: 220 },
      { product: "Tomatoes", quantity: 26, cost: 130 },
      { product: "Eggs", quantity: 18, cost: 470 },
      { product: "White Rice", quantity: 16, cost: 390 },
      { product: "Oranges", quantity: 30, cost: 120 },
      { product: "Strawberries", quantity: 18, cost: 280 },
      { product: "Dry Pasta", quantity: 16, cost: 300 },
      { product: "Cornflakes Cereal", quantity: 14, cost: 340 },
      { product: "Plain Yogurt", quantity: 18, cost: 190 },
    ],
    jordan: [
      { product: "Bottled Water", quantity: 52, cost: 100 },
      { product: "Orange Juice Carton", quantity: 28, cost: 230 },
      { product: "Full Cream Milk", quantity: 24, cost: 280 },
      { product: "Potato Chips Packet", quantity: 32, cost: 170 },
      { product: "White Bread Loaf", quantity: 15, cost: 220 },
      { product: "Tea Bags Box", quantity: 18, cost: 300 },
      { product: "Ground Coffee Bag", quantity: 15, cost: 500 },
      { product: "Cola Soft Drink Bottle", quantity: 26, cost: 150 },
      { product: "Cornflakes Cereal", quantity: 12, cost: 340 },
    ],
    mia: [
      { product: "Kitchen Knife", quantity: 12, cost: 690 },
      { product: "Cutting Board", quantity: 12, cost: 470 },
      { product: "Frying Pan", quantity: 10, cost: 880 },
      { product: "Cooking Pot", quantity: 8, cost: 990 },
      { product: "Food Storage Containers", quantity: 16, cost: 540 },
      { product: "Blender Appliance", quantity: 5, cost: 1890 },
      { product: "Toaster Appliance", quantity: 7, cost: 1410 },
      { product: "Batteries Pack", quantity: 18, cost: 390 },
      { product: "Light Bulbs Pack", quantity: 14, cost: 490 },
    ],
    noah: [
      { product: "T-Shirt", quantity: 18, cost: 610 },
      { product: "Socks Pair", quantity: 44, cost: 240 },
      { product: "Underwear Pack", quantity: 30, cost: 280 },
      { product: "Bar Soap", quantity: 26, cost: 150 },
      { product: "Tissues Box", quantity: 25, cost: 180 },
      { product: "Shampoo Bottle", quantity: 18, cost: 430 },
      { product: "Toothbrush", quantity: 16, cost: 190 },
      { product: "Toothpaste Tube", quantity: 20, cost: 220 },
      { product: "Deodorant Stick", quantity: 15, cost: 330 },
      { product: "Laundry Detergent Liquid", quantity: 12, cost: 650 },
    ],
  };

  for (const [username, items] of Object.entries(inventorySeed)) {
    const user = users.get(username);
    if (!user) continue;

    for (const item of items) {
      const product = products.get(item.product);
      if (!product) continue;

      await prisma.inventory.upsert({
        where: {
          userId_productId: {
            userId: user.id,
            productId: product.id,
          },
        },
        update: {
          quantity: {
            increment: item.quantity,
          },
          averageUnitCost: item.cost,
        },
        create: {
          userId: user.id,
          productId: product.id,
          quantity: item.quantity,
          averageUnitCost: item.cost,
        },
      });
    }
  }

  const listingSeed: Record<
    string,
    Array<{ product: string; price: number; quantity: number; active?: boolean }>
  > = {
    avery: [
      { product: "Apples", price: 175, quantity: 18 },
      { product: "Bananas", price: 145, quantity: 14 },
      { product: "White Bread Loaf", price: 330, quantity: 8 },
      { product: "Tomatoes", price: 210, quantity: 10 },
      { product: "Eggs", price: 640, quantity: 6 },
      { product: "Oranges", price: 225, quantity: 12 },
      { product: "Strawberries", price: 495, quantity: 8 },
      { product: "Plain Yogurt", price: 355, quantity: 10 },
    ],
    jordan: [
      { product: "Bottled Water", price: 185, quantity: 20 },
      { product: "Orange Juice Carton", price: 355, quantity: 11 },
      { product: "Full Cream Milk", price: 420, quantity: 10 },
      { product: "Potato Chips Packet", price: 285, quantity: 14 },
      { product: "Tea Bags Box", price: 540, quantity: 8 },
      { product: "Ground Coffee Bag", price: 860, quantity: 7 },
      { product: "Cola Soft Drink Bottle", price: 310, quantity: 12 },
    ],
    mia: [
      { product: "Kitchen Knife", price: 1090, quantity: 5 },
      { product: "Cutting Board", price: 790, quantity: 6 },
      { product: "Frying Pan", price: 1490, quantity: 4 },
      { product: "Cooking Pot", price: 1690, quantity: 4 },
      { product: "Food Storage Containers", price: 940, quantity: 8 },
      { product: "Batteries Pack", price: 690, quantity: 8 },
      { product: "Light Bulbs Pack", price: 860, quantity: 7 },
    ],
    noah: [
      { product: "T-Shirt", price: 920, quantity: 7 },
      { product: "Socks Pair", price: 395, quantity: 20 },
      { product: "Underwear Pack", price: 560, quantity: 12 },
      { product: "Tissues Box", price: 320, quantity: 11 },
      { product: "Bar Soap", price: 250, quantity: 10 },
      { product: "Shampoo Bottle", price: 810, quantity: 8 },
      { product: "Toothbrush", price: 390, quantity: 10 },
      { product: "Deodorant Stick", price: 650, quantity: 7 },
    ],
  };

  const listings = new Map<string, string>();

  for (const [username, shopListings] of Object.entries(listingSeed)) {
    const user = users.get(username);
    if (!user) continue;

    for (const item of shopListings) {
      const product = products.get(item.product);
      if (!product) continue;

      const listing = await prisma.listing.upsert({
        where: {
          shopId_productId: {
            shopId: user.shopId,
            productId: product.id,
          },
        },
        update: {
          price: item.price,
          quantity: item.quantity,
          active: item.active ?? true,
        },
        create: {
          shopId: user.shopId,
          productId: product.id,
          price: item.price,
          quantity: item.quantity,
          active: item.active ?? true,
        },
      });

      listings.set(`${username}:${item.product}`, listing.id);

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

  const sampleOrders = shouldReset || existingUsers === 0 ? [
    {
      buyer: "jordan",
      seller: "avery",
      sellerShop: "Fresh Basket Co",
      hoursAgo: 10,
      items: [
        { product: "Apples", quantity: 4, unitPrice: 175, listingKey: "avery:Apples" },
        { product: "White Bread Loaf", quantity: 1, unitPrice: 330, listingKey: "avery:White Bread Loaf" },
      ],
    },
    {
      buyer: "avery",
      seller: "jordan",
      sellerShop: "Sip Street",
      hoursAgo: 6,
      items: [
        { product: "Bottled Water", quantity: 3, unitPrice: 185, listingKey: "jordan:Bottled Water" },
        { product: "Orange Juice Carton", quantity: 2, unitPrice: 355, listingKey: "jordan:Orange Juice Carton" },
      ],
    },
    {
      buyer: "mia",
      seller: "noah",
      sellerShop: "Daily Thread",
      hoursAgo: 3,
      items: [
        { product: "Socks Pair", quantity: 5, unitPrice: 395, listingKey: "noah:Socks Pair" },
        { product: "Tissues Box", quantity: 2, unitPrice: 320, listingKey: "noah:Tissues Box" },
      ],
    },
  ] : [];

  for (const orderSeed of sampleOrders) {
    const buyer = users.get(orderSeed.buyer);
    const seller = users.get(orderSeed.seller);
    if (!buyer || !seller) continue;

    const totalPrice = orderSeed.items.reduce(
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

    for (const item of orderSeed.items) {
      const product = products.get(item.product);
      const listingId = listings.get(item.listingKey);
      if (!product) continue;

      await prisma.orderLineItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          listingId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.quantity * item.unitPrice,
          createdAt: subHours(new Date(), orderSeed.hoursAgo),
        },
      });
    }

    const summary = orderSeed.items
      .map((item) => `${item.quantity}x ${item.product}`)
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

  if (shouldReset || existingUsers === 0) {
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
          message: "Kitchen shoppers are browsing more this afternoon. Consider adjusting prices or restocking.",
          createdAt: subMinutes(new Date(), 40),
        },
      ],
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

  for (const bot of INITIAL_BOTS) {
    await prisma.botCustomer.upsert({
      where: { displayName: bot.displayName },
      update: {
        type: bot.type,
        budget: bot.budget,
        preferenceCategory: bot.preferenceCategory,
        loyaltyShopId:
          bot.type === "LOYAL" ? users.get("jordan")?.shopId : bot.type === "QUALITY" ? users.get("avery")?.shopId : null,
        activityLevel: bot.activityLevel,
        active: true,
      },
      create: {
        displayName: bot.displayName,
        type: bot.type,
        budget: bot.budget,
        preferenceCategory: bot.preferenceCategory,
        loyaltyShopId:
          bot.type === "LOYAL" ? users.get("jordan")?.shopId : bot.type === "QUALITY" ? users.get("avery")?.shopId : null,
        activityLevel: bot.activityLevel,
        lastPurchasedAt: subHours(new Date(), Math.floor(Math.random() * 9) + 1),
      },
    });
  }

  for (const product of PRODUCT_CATALOG) {
    const state = await prisma.marketProductState.findUnique({
      where: { productId: products.get(product.name)!.id },
    });

    if (!state) continue;

    const relatedListings = await prisma.listing.findMany({
      where: { productId: state.productId },
      select: { price: true },
    });

    await prisma.marketProductState.update({
      where: { id: state.id },
      data: {
        marketAveragePrice: average(relatedListings.map((listing) => listing.price)),
      },
    });
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
