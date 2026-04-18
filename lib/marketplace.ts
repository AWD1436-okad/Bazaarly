import { Prisma, ProductCategory, ShopStatus, type Listing, type MarketEvent, type Shop } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type MarketplaceParams = {
  q?: string;
  sort?: string;
  category?: string;
  stock?: string;
  minRating?: string;
  minPrice?: string;
  maxPrice?: string;
};

type ListingWithRelations = Listing & {
  product: {
    id: string;
    name: string;
    category: ProductCategory;
    description: string;
    keywords: unknown;
  };
  shop: Shop & {
    owner: {
      displayName: string;
    };
  };
};

function tokenize(query: string) {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function scoreListing(listing: ListingWithRelations, query: string) {
  if (!query) {
    return (
      listing.shop.rating * 20 +
      Math.min(listing.quantity, 20) +
      (listing.price <= 500 ? 12 : 0)
    );
  }

  const normalized = query.toLowerCase();
  const tokens = tokenize(query);
  const name = listing.product.name.toLowerCase();
  const shopName = listing.shop.name.toLowerCase();
  const description = listing.product.description.toLowerCase();
  const category = listing.product.category.toLowerCase();
  const keywords = Array.isArray(listing.product.keywords)
    ? listing.product.keywords.map((keyword) => String(keyword).toLowerCase())
    : [];

  let score = 0;

  if (name === normalized) score += 160;
  if (name.includes(normalized)) score += 110;
  if (shopName.includes(normalized)) score += 70;
  if (category.includes(normalized)) score += 60;
  if (description.includes(normalized)) score += 40;

  for (const token of tokens) {
    if (name.includes(token)) score += 28;
    if (shopName.includes(token)) score += 18;
    if (description.includes(token)) score += 12;
    if (category.includes(token)) score += 14;
    if (keywords.some((keyword) => keyword.includes(token))) score += 20;
  }

  score += Math.min(listing.quantity, 25);
  score += listing.shop.rating * 10;
  score += Math.max(0, 20 - listing.price / 100);

  return score;
}

export async function getMarketplaceData(params: MarketplaceParams) {
  const query = params.q?.trim() ?? "";
  const minPrice = params.minPrice ? Number(params.minPrice) * 100 : null;
  const maxPrice = params.maxPrice ? Number(params.maxPrice) * 100 : null;
  const minRating = params.minRating ? Number(params.minRating) : null;
  const inStockOnly = params.stock === "in";
  const normalizedQuery = query.toLowerCase();
  const categoryFilter =
    params.category && params.category !== "ALL" ? (params.category as ProductCategory) : null;

  const where: Prisma.ListingWhereInput = {
    active: true,
    shop: {
      status: ShopStatus.ACTIVE,
      ...(minRating ? { rating: { gte: minRating } } : {}),
    },
    ...(inStockOnly ? { quantity: { gt: 0 } } : {}),
    ...(minPrice !== null || maxPrice !== null
      ? {
          price: {
            ...(minPrice !== null ? { gte: minPrice } : {}),
            ...(maxPrice !== null ? { lte: maxPrice } : {}),
          },
        }
      : {}),
    ...(categoryFilter ? { product: { category: categoryFilter } } : {}),
  };

  if (query) {
    const categoryMatches = Object.values(ProductCategory)
      .filter((value) => value.toLowerCase().includes(normalizedQuery))
      .map((value) => ({ product: { category: value } as Prisma.ProductWhereInput }));

    where.OR = [
      { product: { name: { contains: query, mode: "insensitive" } } },
      { product: { description: { contains: query, mode: "insensitive" } } },
      { shop: { name: { contains: query, mode: "insensitive" } } },
      ...categoryMatches,
    ];
  }

  const sort = params.sort ?? "relevance";

  const baseOrderBy: Prisma.ListingOrderByWithRelationInput[] =
    sort === "price-asc"
      ? [{ price: "asc" as const }]
      : sort === "price-desc"
        ? [{ price: "desc" as const }]
        : sort === "rating"
          ? [{ shop: { rating: "desc" as const } }, { quantity: "desc" as const }]
          : sort === "stock"
            ? [{ quantity: "desc" as const }, { shop: { rating: "desc" as const } }]
            : [{ updatedAt: "desc" as const }];

  const listings: ListingWithRelations[] = await prisma.listing.findMany({
    where,
    include: {
      product: true,
      shop: {
        include: {
          owner: {
            select: {
              displayName: true,
            },
          },
        },
      },
    },
    orderBy: baseOrderBy,
    take: query ? 120 : 60,
  });

  const filtered = listings
    .map((listing) => ({
      ...listing,
      relevanceScore: scoreListing(listing, query),
    }))
    .filter((listing) => {
      if (!query) {
        return true;
      }

      return listing.relevanceScore > 0;
    });

  filtered.sort((a, b) => {
    switch (sort) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "rating":
        return b.shop.rating - a.shop.rating;
      case "stock":
        return b.quantity - a.quantity;
      default:
        return b.relevanceScore - a.relevanceScore;
    }
  });

  const [activeEvent, productStates, topShops] = await Promise.all([
    prisma.marketEvent.findFirst({
      where: {
        active: true,
        startsAt: { lte: new Date() },
        endsAt: { gte: new Date() },
      },
      orderBy: {
        startsAt: "desc",
      },
    }),
    prisma.marketProductState.findMany({
      include: {
        product: true,
      },
      orderBy: [{ demandScore: "desc" }, { popularityScore: "desc" }],
      take: 5,
    }),
    prisma.shop.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ totalRevenue: "desc" }, { rating: "desc" }],
      take: 5,
    }),
  ]);

  return {
    listings: filtered.slice(0, 48),
    activeEvent,
    topShops,
    trendingProducts: productStates,
  };
}

export async function getShopPageData(shopId: string) {
  return prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      owner: true,
      listings: {
        include: {
          product: true,
        },
        orderBy: [{ active: "desc" }, { quantity: "desc" }, { updatedAt: "desc" }],
      },
    },
  });
}

export async function getActiveEvent(): Promise<MarketEvent | null> {
  return prisma.marketEvent.findFirst({
    where: {
      active: true,
      startsAt: { lte: new Date() },
      endsAt: { gte: new Date() },
    },
    orderBy: { startsAt: "desc" },
  });
}
