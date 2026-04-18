import { ProductCategory, type Listing, type MarketEvent, type Shop } from "@prisma/client";

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
  const listings = await prisma.listing.findMany({
    where: {
      active: true,
      shop: {
        status: "ACTIVE",
      },
    },
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
  });

  const query = params.q?.trim() ?? "";
  const minPrice = params.minPrice ? Number(params.minPrice) * 100 : null;
  const maxPrice = params.maxPrice ? Number(params.maxPrice) * 100 : null;
  const minRating = params.minRating ? Number(params.minRating) : null;
  const inStockOnly = params.stock === "in";

  const filtered = listings
    .map((listing) => ({
      ...listing,
      relevanceScore: scoreListing(listing, query),
    }))
    .filter((listing) => {
      if (
        params.category &&
        params.category !== "ALL" &&
        listing.product.category !== params.category
      ) {
        return false;
      }

      if (inStockOnly && listing.quantity <= 0) {
        return false;
      }

      if (minRating && listing.shop.rating < minRating) {
        return false;
      }

      if (minPrice !== null && listing.price < minPrice) {
        return false;
      }

      if (maxPrice !== null && listing.price > maxPrice) {
        return false;
      }

      if (!query) {
        return true;
      }

      return listing.relevanceScore > 0;
    });

  const sort = params.sort ?? "relevance";

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

  const activeEvent = await prisma.marketEvent.findFirst({
    where: {
      active: true,
      startsAt: { lte: new Date() },
      endsAt: { gte: new Date() },
    },
    orderBy: {
      startsAt: "desc",
    },
  });

  const productStates = await prisma.marketProductState.findMany({
    include: {
      product: true,
    },
    orderBy: [{ demandScore: "desc" }, { popularityScore: "desc" }],
    take: 5,
  });

  const topShops = await prisma.shop.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ totalRevenue: "desc" }, { rating: "desc" }],
    take: 5,
  });

  return {
    listings: filtered,
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
        where: { active: true },
        include: {
          product: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
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
