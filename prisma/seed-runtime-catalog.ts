import "dotenv/config";

import { PrismaClient } from "@prisma/client";

import { PRODUCT_CATALOG } from "../lib/catalog";
import { buildCatalogPriceProfiles } from "../lib/price-profiles";

const prisma = new PrismaClient();

async function upsertCatalogProducts() {
  let created = 0;
  let updated = 0;

  for (const product of PRODUCT_CATALOG) {
    const priceProfiles = buildCatalogPriceProfiles({
      name: product.name,
      category: product.category,
      subcategory: product.subcategory,
      unitLabel: product.unitLabel,
      basePrice: product.basePrice,
      supplierRatio: product.supplierPrice / product.basePrice,
    });

    const audProfile = priceProfiles.find((profile) => profile.currencyCode === "AUD") ?? {
      basePrice: product.basePrice,
      supplierPrice: product.supplierPrice,
      marketAveragePrice: product.basePrice,
    };

    const existing = await prisma.product.findUnique({
      where: { sku: product.sku },
      select: { id: true },
    });

    const saved = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        category: product.category,
        subcategory: product.subcategory ?? null,
        unitLabel: product.unitLabel,
        description: product.description,
        basePrice: audProfile.basePrice,
        spoilable: product.spoilable,
        shelfLife: product.shelfLife,
        imageUrl: product.imageUrl,
        keywords: product.keywords,
      },
      create: {
        sku: product.sku,
        name: product.name,
        category: product.category,
        subcategory: product.subcategory ?? null,
        unitLabel: product.unitLabel,
        description: product.description,
        basePrice: audProfile.basePrice,
        spoilable: product.spoilable,
        shelfLife: product.shelfLife,
        imageUrl: product.imageUrl,
        keywords: product.keywords,
      },
    });

    if (existing) {
      updated += 1;
    } else {
      created += 1;
    }

    for (const profile of priceProfiles) {
      await prisma.productPriceProfile.upsert({
        where: {
          productId_currencyCode: {
            productId: saved.id,
            currencyCode: profile.currencyCode,
          },
        },
        update: {
          unitLabel: profile.unitLabel,
          basePrice: profile.basePrice,
          supplierPrice: profile.supplierPrice,
          marketAveragePrice: profile.marketAveragePrice,
        },
        create: {
          productId: saved.id,
          currencyCode: profile.currencyCode,
          unitLabel: profile.unitLabel,
          basePrice: profile.basePrice,
          supplierPrice: profile.supplierPrice,
          marketAveragePrice: profile.marketAveragePrice,
        },
      });
    }

    await prisma.marketProductState.upsert({
      where: { productId: saved.id },
      update: {
        currentSupplierPrice: audProfile.supplierPrice,
        demandScore: product.demandScore,
        popularityScore: product.popularityScore,
        trendLabel: product.trendLabel,
        marketAveragePrice: audProfile.marketAveragePrice,
      },
      create: {
        productId: saved.id,
        currentSupplierPrice: audProfile.supplierPrice,
        demandScore: product.demandScore,
        popularityScore: product.popularityScore,
        trendLabel: product.trendLabel,
        supplierStock: 450,
        marketAveragePrice: audProfile.marketAveragePrice,
      },
    });
  }

  return { created, updated };
}

async function disableBaconIfPresent() {
  const baconProducts = await prisma.product.findMany({
    where: {
      OR: [{ name: { contains: "bacon", mode: "insensitive" } }, { sku: { contains: "bacon" } }],
    },
    select: { id: true, name: true, sku: true },
  });

  if (baconProducts.length === 0) {
    return { disabledProducts: 0, disabledListings: 0 };
  }

  const baconIds = baconProducts.map((product) => product.id);

  const listingUpdate = await prisma.listing.updateMany({
    where: { productId: { in: baconIds } },
    data: {
      active: false,
      isPaused: true,
      quantity: 0,
    },
  });

  await prisma.marketProductState.updateMany({
    where: { productId: { in: baconIds } },
    data: {
      supplierStock: 0,
      demandScore: 0.1,
      trendLabel: "Removed from active catalog",
      marketAveragePrice: 0,
    },
  });

  return { disabledProducts: baconProducts.length, disabledListings: listingUpdate.count };
}

async function verifyLambAndClothing() {
  const lamb = await prisma.product.findFirst({
    where: {
      OR: [{ sku: "protein-lamb" }, { name: { equals: "Lamb", mode: "insensitive" } }],
    },
    select: { id: true, name: true, basePrice: true, unitLabel: true, category: true },
  });

  const addedClothingNames = [
    "Denim Jeans",
    "Cargo Pants",
    "Polo Shirt",
    "Dress Shirt",
    "Running Shoes",
    "Winter Coat",
  ];

  const clothingProducts = await prisma.product.findMany({
    where: { name: { in: addedClothingNames } },
    select: { name: true, basePrice: true, unitLabel: true },
  });

  return {
    lamb,
    clothingProducts,
  };
}

async function main() {
  const catalogSync = await upsertCatalogProducts();
  const bacon = await disableBaconIfPresent();
  const verification = await verifyLambAndClothing();

  console.log(
    JSON.stringify(
      {
        catalogSync,
        bacon,
        verification,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
