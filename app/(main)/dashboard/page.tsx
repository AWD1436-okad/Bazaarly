import { Prisma, ProductCategory, ShopStatus } from "@prisma/client";
import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BulkListingVisibilityControls } from "@/components/bulk-listing-visibility-controls";
import { BulkSoldOutCleanup } from "@/components/bulk-sold-out-cleanup";
import { ChallengeCountdown } from "@/components/challenge-countdown";
import { DashboardListingCreateForm } from "@/components/dashboard-listing-create-form";
import { DashboardListingManageForm } from "@/components/dashboard-listing-manage-form";
import { InstallAppCard } from "@/components/install-app-card";
import { ProductVisual } from "@/components/product-visual";
import { SoldOutListingActions } from "@/components/sold-out-listing-actions";
import { SimulationHeartbeat } from "@/components/simulation-heartbeat";
import { StatusBanner } from "@/components/status-banner";
import { getProductCategoryLabel } from "@/lib/catalog";
import { requireUser } from "@/lib/auth";
import { getNetProfitSummary } from "@/lib/business-ledger";
import { getDashboardChallenges } from "@/lib/challenges";
import { formatCurrency, formatCurrencyInputValue, formatPriceWithUnit } from "@/lib/money";
import { getPlayerModeConfig } from "@/lib/player-mode";
import { getActiveCurrencyCode } from "@/lib/price-profiles";
import { prisma } from "@/lib/prisma";
import { sanitizeStockCount, getLiveStockStatusMessage } from "@/lib/stock";

const INVENTORY_PAGE_SIZE = 3;
const LISTING_PAGE_SIZE = 3;
const LISTING_OPTION_LIMIT = 40;
const PLAYER_LEVELS = [
  { name: "Street Seller", xp: 0 },
  { name: "Corner Shop", xp: 180 },
  { name: "Local Market", xp: 450 },
  { name: "Retail Empire", xp: 950 },
  { name: "Planet Tycoon", xp: 1700 },
] as const;

type DashboardProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type FreeInventoryRow = {
  inventoryId: string;
  productId: string;
  productName: string;
  productCategory: ProductCategory;
  productSubcategory: string | null;
  productImageUrl: string | null;
  unitLabel: string;
  availableToList: number;
  marketAveragePrice: number;
};

type BestSellerRow = {
  productId: string;
  productName: string;
  productCategory: ProductCategory;
  productSubcategory: string | null;
  productImageUrl: string | null;
  units: number;
  revenueCents: number;
  profitCents: number;
};

function buildDashboardHref(
  params: Record<string, string | string[] | undefined>,
  updates: Record<string, number | null>,
) {
  const nextParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.length > 0) {
      nextParams.set(key, value);
    }
  }

  for (const [key, value] of Object.entries(updates)) {
    if (!value || value <= 1) {
      nextParams.delete(key);
    } else {
      nextParams.set(key, String(value));
    }
  }

  const queryString = nextParams.toString();
  return queryString ? `/dashboard?${queryString}` : "/dashboard";
}

export default async function DashboardPage({ searchParams }: DashboardProps) {
  const user = await requireUser();
  const currencyCode = await getActiveCurrencyCode(user.id);
  const playerModeConfig = getPlayerModeConfig((user as { playerMode?: unknown }).playerMode);
  const moneyLabels = playerModeConfig.moneyLabels;

  if (!user.shop) {
    redirect("/onboarding/shop");
  }
  const currentShopId = user.shop.id;

  const params = (await searchParams) ?? {};
  const welcome = params.welcome === "1";
  const listingSuccess = params.listingSuccess === "1";
  const bulkListed = params.bulkListed === "1";
  const bulkListedCreated = Number(params.bulkListedCreated ?? "0") || 0;
  const bulkListedUpdated = Number(params.bulkListedUpdated ?? "0") || 0;
  const bulkListedSkipped = Number(params.bulkListedSkipped ?? "0") || 0;
  const error = typeof params.error === "string" ? params.error : null;
  const inventoryPage = Math.max(Number(params.inventoryPage ?? "1") || 1, 1);
  const listingsPage = Math.max(Number(params.listingsPage ?? "1") || 1, 1);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const [
    listingOptions,
    freeInventoryRows,
    recentSales,
    lowStockListings,
    bestSellerRows,
    inventoryPresence,
    todayProfitSummary,
    totalProfitSummary,
    soldOutListingCount,
    listingTotalCount,
    activeListingCount,
    pausedListingCount,
    activeMarketEvent,
    trendingStates,
    leaderboardShops,
  ] =
    await Promise.all([
      prisma.inventory.findMany({
        where: {
          userId: user.id,
          quantity: {
            gt: 0,
          },
        },
        select: {
          id: true,
          productId: true,
          quantity: true,
          allocatedQuantity: true,
          product: {
            select: {
              name: true,
              category: true,
              subcategory: true,
              imageUrl: true,
              unitLabel: true,
              basePrice: true,
              marketState: {
                select: {
                  marketAveragePrice: true,
                },
              },
            },
          },
        },
        orderBy: {
          product: {
            name: "asc",
          },
        },
      }),
      prisma.inventory.findMany({
        where: {
          userId: user.id,
          quantity: {
            gt: 0,
          },
        },
        select: {
          id: true,
          productId: true,
          quantity: true,
          allocatedQuantity: true,
          product: {
            select: {
              name: true,
              category: true,
              subcategory: true,
              imageUrl: true,
              unitLabel: true,
              basePrice: true,
              marketState: {
                select: {
                  marketAveragePrice: true,
                },
              },
            },
          },
        },
        orderBy: {
          product: {
            name: "asc",
          },
        },
      }),
      prisma.order.findMany({
        where: { sellerId: user.id },
        select: {
          id: true,
          totalPrice: true,
          createdAt: true,
          buyer: {
            select: {
              displayName: true,
            },
          },
          lineItems: {
            select: {
              id: true,
              quantity: true,
              lineProfit: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  subcategory: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.listing.findMany({
        where: {
          shopId: user.shop.id,
          quantity: { lte: 5 },
        },
        select: {
          id: true,
          quantity: true,
          product: {
            select: {
              name: true,
              category: true,
              subcategory: true,
              imageUrl: true,
            },
          },
        },
        orderBy: { quantity: "asc" },
        take: 5,
      }),
      prisma.$queryRaw<BestSellerRow[]>(Prisma.sql`
        SELECT
          oli."productId" AS "productId",
          p."name" AS "productName",
          p."category" AS "productCategory",
          p."subcategory" AS "productSubcategory",
          p."imageUrl" AS "productImageUrl",
          COALESCE(SUM(oli."quantity"), 0)::int AS "units",
          COALESCE(SUM(oli."lineTotal"), 0)::int AS "revenueCents",
          COALESCE(SUM(oli."lineProfit"), 0)::int AS "profitCents"
        FROM "OrderLineItem" oli
        INNER JOIN "Order" o ON o."id" = oli."orderId"
        INNER JOIN "Product" p ON p."id" = oli."productId"
        WHERE o."sellerId" = ${user.id}
        GROUP BY oli."productId", p."name", p."category", p."subcategory", p."imageUrl"
        ORDER BY SUM(oli."quantity") DESC, SUM(oli."lineProfit") DESC
        LIMIT 4
      `),
      prisma.inventory.findFirst({
        where: {
          userId: user.id,
          quantity: { gt: 0 },
        },
        select: {
          id: true,
        },
      }),
      getNetProfitSummary({ userId: user.id, startAt: startOfToday, endAt: endOfToday }),
      getNetProfitSummary({ userId: user.id }),
      prisma.listing.count({
        where: {
          shopId: user.shop.id,
          quantity: { lte: 0 },
        },
      }),
      prisma.listing.count({
        where: {
          shopId: user.shop.id,
          OR: [{ active: true }, { quantity: { lte: 0 } }, { isPaused: true }],
        },
      }),
      prisma.listing.count({
        where: {
          shopId: user.shop.id,
          quantity: { gt: 0 },
          active: true,
          isPaused: false,
        },
      }),
      prisma.listing.count({
        where: {
          shopId: user.shop.id,
          quantity: { gt: 0 },
          isPaused: true,
        },
      }),
      prisma.marketEvent.findFirst({
        where: {
          active: true,
          startsAt: { lte: new Date() },
          endsAt: { gte: new Date() },
        },
        select: {
          name: true,
          description: true,
          effectValue: true,
          endsAt: true,
          category: true,
          product: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { startsAt: "desc" },
      }),
      prisma.marketProductState.findMany({
        where: {
          product: {
            listings: {
              some: {
                active: true,
                isPaused: false,
                quantity: { gt: 0 },
              },
            },
          },
        },
        select: {
          demandScore: true,
          trendLabel: true,
          product: {
            select: {
              name: true,
              category: true,
              subcategory: true,
              imageUrl: true,
            },
          },
        },
        orderBy: [{ demandScore: "desc" }, { popularityScore: "desc" }],
        take: 3,
      }),
      prisma.shop.findMany({
        where: { status: ShopStatus.ACTIVE },
        select: {
          id: true,
          name: true,
          rating: true,
          totalRevenue: true,
          totalSales: true,
        },
        orderBy: [{ totalRevenue: "desc" }, { totalSales: "desc" }],
        take: 3,
      }),
    ]);

  const listingOptionRows = listingOptions
    .map((item) => {
      return {
        inventoryId: item.id,
        productId: item.productId,
        productName: item.product.name,
        productCategory: item.product.category,
        productSubcategory: item.product.subcategory,
        productImageUrl: item.product.imageUrl,
        unitLabel: item.product.unitLabel,
        availableToList: sanitizeStockCount(
          sanitizeStockCount(item.quantity) - sanitizeStockCount(item.allocatedQuantity),
        ),
        marketAveragePrice: item.product.marketState?.marketAveragePrice ?? item.product.basePrice,
      };
    })
    .filter((item) => item.availableToList > 0)
    .slice(0, LISTING_OPTION_LIMIT);
  const freeInventoryRowList = freeInventoryRows
    .map((item) => {
      return {
        inventoryId: item.id,
        productId: item.productId,
        productName: item.product.name,
        productCategory: item.product.category,
        productSubcategory: item.product.subcategory,
        productImageUrl: item.product.imageUrl,
        unitLabel: item.product.unitLabel,
        availableToList: sanitizeStockCount(
          sanitizeStockCount(item.quantity) - sanitizeStockCount(item.allocatedQuantity),
        ),
        marketAveragePrice: item.product.marketState?.marketAveragePrice ?? item.product.basePrice,
      };
    })
    .filter((item) => item.availableToList > 0);
  const totalInventoryPages = Math.max(
    1,
    Math.ceil(freeInventoryRowList.length / INVENTORY_PAGE_SIZE),
  );
  const safeInventoryPage = Math.min(inventoryPage, totalInventoryPages);
  const inventoryOffset = (safeInventoryPage - 1) * INVENTORY_PAGE_SIZE;
  const visibleInventory = freeInventoryRowList.slice(
    inventoryOffset,
    inventoryOffset + INVENTORY_PAGE_SIZE,
  );
  const hasNextInventoryPage = safeInventoryPage < totalInventoryPages;
  const freeInventoryCount = freeInventoryRowList.length;
  const totalListingsPages = Math.max(1, Math.ceil(listingTotalCount / LISTING_PAGE_SIZE));
  const safeListingsPage = Math.min(listingsPage, totalListingsPages);
  const visibleListings = await prisma.listing.findMany({
    where: {
      shopId: user.shop.id,
      OR: [{ active: true }, { quantity: { lte: 0 } }, { isPaused: true }],
    },
    select: {
      id: true,
      shopId: true,
      productId: true,
      price: true,
      quantity: true,
      active: true,
      isPaused: true,
      soldOutAt: true,
      createdAt: true,
      updatedAt: true,
      product: {
        select: {
          id: true,
          name: true,
          subcategory: true,
          unitLabel: true,
          category: true,
          imageUrl: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    skip: (safeListingsPage - 1) * LISTING_PAGE_SIZE,
    take: LISTING_PAGE_SIZE,
  });
  const hasNextListingsPage = safeListingsPage < totalListingsPages;
  const defaultListingPrice =
    listingOptionRows.length > 0
      ? formatCurrencyInputValue(listingOptionRows[0].marketAveragePrice, currencyCode)
      : "2.50";
  const todayProfit = todayProfitSummary.netProfitCents;
  const totalProfit = totalProfitSummary.netProfitCents;
  const progression = getProgression((user as { xp?: number | null }).xp ?? 0);
  const hasInventory = Boolean(inventoryPresence);
  const starterMissions = getStarterMissions({
    hasInventory,
    activeListingCount,
    totalSales: user.shop.totalSales,
    totalProfit,
    currencyCode,
  });
  const nextStarterMission = starterMissions.find((mission) => !mission.complete);
  const winProgress = getWinProgress(totalProfit, activeListingCount, progression.level);

  const bestSellers = bestSellerRows.map((item) => ({
    name: item.productName,
    category: item.productCategory,
    subcategory: item.productSubcategory,
    imageUrl: item.productImageUrl,
    units: item.units,
    revenueCents: item.revenueCents,
    profitCents: item.profitCents,
  }));
  const challengeSet = await getDashboardChallenges({
    userId: user.id,
    shopId: user.shop.id,
    currencyCode,
    activeListingCount,
    playerMode: playerModeConfig.value,
  });
  const completedChallenges = challengeSet.challenges.filter((challenge) => challenge.completed).length;
  const previewChallenges = challengeSet.challenges.slice(0, 2);

  const purchasedItems = await prisma.orderLineItem.aggregate({
    where: {
      order: {
        buyerId: user.id,
      },
    },
    _sum: { quantity: true },
  });

  if (safeInventoryPage !== inventoryPage) {
    redirect(buildDashboardHref(params, { inventoryPage: safeInventoryPage }) as Route);
  }

  if (safeListingsPage !== listingsPage) {
    redirect(buildDashboardHref(params, { listingsPage: safeListingsPage }) as Route);
  }

  if (params.manage === "1") {
    redirect("/dashboard");
  }

  if (params.manage !== "1") {
    return (
      <div className="page-grid dashboard-simple">
        <SimulationHeartbeat intervalMs={70000} initialDelayMs={12000} />
        {welcome ? <StatusBanner tone="success" title="Your shop is ready" body="Your starter stock is ready to trade." /> : null}
        {error ? <StatusBanner tone="error" title="Action needs attention" body={error} /> : null}
        <section className="page-header">
          <div>
            <h1>{user.shop.name}</h1>
            <p className="muted">Your shop dashboard</p>
          </div>
        </section>

        <section className="metrics-grid dashboard-simple__metrics">
          <article className="metric-card">
            <span className="metric-card__eyebrow">Sales made</span>
            <strong>{user.shop.totalSales}</strong>
          </article>
          <article className="metric-card">
            <span className="metric-card__eyebrow">Items bought</span>
            <strong>{purchasedItems._sum.quantity ?? 0}</strong>
          </article>
          <article className="metric-card">
            <span className="metric-card__eyebrow">Money</span>
            <strong>{formatCurrency(user.balance, currencyCode)}</strong>
          </article>
          <article className="metric-card">
            <span className="metric-card__eyebrow">Today profit</span>
            <strong>{formatCurrency(todayProfit, currencyCode)}</strong>
          </article>
          <article className="metric-card">
            <span className="metric-card__eyebrow">Total profit</span>
            <strong>{formatCurrency(totalProfit, currencyCode)}</strong>
          </article>
        </section>

        <section className="dashboard-simple__actions">
          <article className="card dashboard-simple__list-card">
            <div className="section-heading">
              <div>
                <h2>List an item</h2>
                <p className="muted">Choose stock and set its sale price.</p>
              </div>
            </div>
            {listingOptionRows.length > 0 ? (
              <DashboardListingCreateForm
                listingOptions={listingOptionRows.map((item) => ({
                  ...item,
                  displayMarketAverageLabel: formatCurrency(item.marketAveragePrice, currencyCode),
                }))}
                defaultListingPrice={defaultListingPrice}
              />
            ) : (
              <div className="empty-state">
                <p>Buy stock before you list an item.</p>
                <Link href="/dashboard/supplier" className="ghost-button">Buy stock</Link>
              </div>
            )}
          </article>

          <article className="card dashboard-simple__stock-card">
            <div className="section-heading">
              <div>
                <h2>Your stock</h2>
                <p className="muted">Items ready to list.</p>
              </div>
              <Link href="/dashboard/supplier" className="ghost-button">Buy stock</Link>
            </div>
            {visibleInventory.length > 0 ? (
              <div className="stock-list">
                {visibleInventory.map((item) => (
                  <div key={item.inventoryId} className="stock-list__item">
                    <ProductVisual
                      name={item.productName}
                      category={item.productCategory}
                      imageUrl={item.productImageUrl}
                      size="compact"
                    />
                    <div>
                      <strong>{item.productName}</strong>
                      <span className="muted">{item.availableToList} ready to sell</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state"><p>No stock yet.</p></div>
            )}
          </article>
        </section>
      </div>
    );
  }

  return (
    <div className={`page-grid ${playerModeConfig.bodyClass}`}>
      <SimulationHeartbeat intervalMs={70000} initialDelayMs={12000} />
      {welcome ? (
        <StatusBanner
          tone="success"
            title="Your shop is ready."
            body="Step 1: Review your starter stock. Step 2: Create your first listing so shoppers can find you."
            action={
              <Link href="/dashboard/supplier" className="ghost-button">
                Buy Stock
              </Link>
            }
          />
      ) : null}

      {listingSuccess ? (
        <StatusBanner
          tone="success"
          title="Your shop is now live."
          body="Customers can now discover and buy your items in the marketplace."
        />
      ) : null}

      {bulkListed ? (
        <StatusBanner
          tone="success"
          title="Bulk listing complete"
          body={`Listed ${bulkListedCreated} products, restocked ${bulkListedUpdated}, skipped ${bulkListedSkipped}.`}
        />
      ) : null}

      {error ? <StatusBanner tone="error" title="Action needs attention" body={error} /> : null}

      {!hasInventory ? (
        <StatusBanner
          tone="warning"
          title="Your inventory is empty"
          body="Buy stock before you put items up for sale."
          action={
            <Link href="/dashboard/supplier" className="ghost-button">
              Buy Stock
            </Link>
          }
        />
      ) : null}
      {user.balance < 3_000 ? (
        <StatusBanner
          tone="warning"
          title="Money is running low"
          body={`You have ${formatCurrency(user.balance, currencyCode)} left. Sell stock or choose cheaper items before your next buy.`}
        />
      ) : null}

      <section className="page-header">
        <h1>{user.shop.name}</h1>
      </section>

      <section className="card player-mode-home-card">
        <div>
          <span className="tag">Player mode: {playerModeConfig.label}</span>
          <h2>{playerModeConfig.dashboardTitle}</h2>
          {playerModeConfig.showDetailedHelpers ? <p>{playerModeConfig.dashboardLead}</p> : null}
        </div>
        <div className="player-mode-quick-actions">
          <Link href="/dashboard/supplier" className="ghost-button">
            {playerModeConfig.value === "LITTLE" ? "Buy" : "Buy stock"}
          </Link>
          <Link href="/marketplace" className="ghost-button">
            {playerModeConfig.value === "LITTLE" ? "Shop" : "Marketplace"}
          </Link>
          <Link href={"/challenges" as Route} className="ghost-button">
            {playerModeConfig.value === "LITTLE" ? "Tasks" : "Challenges"}
          </Link>
        </div>
      </section>

      <section className="metrics-grid">
        <article className="metric-card">
          <span className="metric-card__eyebrow">{moneyLabels.balance}</span>
          <strong>{formatCurrency(user.balance, currencyCode)}</strong>
          {moneyLabels.balanceHelper ? (
            <span className="metric-card__helper">{moneyLabels.balanceHelper}</span>
          ) : null}
        </article>
        <article className="metric-card">
          <span className="metric-card__eyebrow">{moneyLabels.todayNet}</span>
          <strong>{formatCurrency(todayProfit, currencyCode)}</strong>
          {moneyLabels.todayNetHelper ? (
            <span className="metric-card__helper">{moneyLabels.todayNetHelper}</span>
          ) : null}
        </article>
        <article className="metric-card">
          <span className="metric-card__eyebrow">{moneyLabels.totalNet}</span>
          <strong>{formatCurrency(totalProfit, currencyCode)}</strong>
          {moneyLabels.totalNetHelper ? (
            <span className="metric-card__helper">{moneyLabels.totalNetHelper}</span>
          ) : null}
        </article>
      </section>

      <section className="card progression-card">
        <div className="progression-card__copy">
          <span className="tag">Level {progression.level}</span>
          <h2>{progression.title}</h2>
          <p>
            {progression.atMaxLevel
              ? "You reached the top shop tier."
              : `${progression.xpToNext} XP to ${progression.nextTitle}.`}
          </p>
          <div className="challenge-progress progression-card__bar" aria-label={`${progression.progress}% to next level`}>
            <span style={{ width: `${progression.progress}%` }} />
          </div>
        </div>
        <strong className="progression-card__xp">{progression.xp} XP</strong>
      </section>

      <section className="gameplay-grid">
        <article className="card mission-card">
          <div className="card-header">
            <div className="card-header__copy">
              <span className="tag">Starter path</span>
              <h2>{nextStarterMission ? nextStarterMission.title : "Starter path complete"}</h2>
              <p>{nextStarterMission ? nextStarterMission.helper : "Keep growing toward Planet Tycoon."}</p>
            </div>
            <Link href={(nextStarterMission?.href ?? "/challenges") as Route} className="ghost-button">
              {nextStarterMission ? nextStarterMission.action : "Daily goals"}
            </Link>
          </div>
          <div className="mission-track">
            {starterMissions.map((mission, index) => (
              <div key={mission.title} className={mission.complete ? "mission-step mission-step--done" : "mission-step"}>
                <span>{mission.complete ? "✓" : index + 1}</span>
                <div>
                  <strong>{mission.title}</strong>
                  <small>{mission.reward}</small>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="card world-event-card">
          <div className="card-header">
            <div className="card-header__copy">
              <span className="tag">Live world</span>
              <h2>{activeMarketEvent?.name ?? "Customer rush is building"}</h2>
              <p>
                {activeMarketEvent?.description ??
                  "Trending products shift as bots and players buy from the shared marketplace."}
              </p>
            </div>
          </div>
          <div className="world-event-list">
            {trendingStates.map((state) => (
              <div key={state.product.name} className="world-event-row">
                <ProductVisual
                  name={state.product.name}
                  category={state.product.category}
                  subcategory={state.product.subcategory}
                  imageUrl={state.product.imageUrl}
                />
                <div>
                  <strong>{state.product.name}</strong>
                  <span>{state.trendLabel} · demand {state.demandScore.toFixed(2)}x</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="card win-condition-card">
          <span className="tag">Empire goal</span>
          <h2>Build your Profit Planet</h2>
          <p>Reach {formatCurrency(1_000_000, currencyCode)} net profit, hit Level 5, and climb the leaderboard.</p>
          <div className="challenge-progress" aria-label={`${winProgress}% toward empire goal`}>
            <span style={{ width: `${winProgress}%` }} />
          </div>
        </article>
      </section>

      <InstallAppCard compact />

      <section className="dashboard-grid">
        <div className="stack">
          <section className="card">
            <div className="card-header">
              <div className="card-header__copy">
                <h2>Create or update a listing</h2>
                {playerModeConfig.showDetailedHelpers ? (
                  <p>Pick owned stock and put it up for sale.</p>
                ) : null}
              </div>
              <div className="card-toolbar">
                <Link href="/dashboard/supplier" className="ghost-button">
                  Buy Stock
                </Link>
                {playerModeConfig.showAdvancedControls ? (
                  <form action="/listings/list-all" method="post">
                    <button type="submit">List all products</button>
                  </form>
                ) : null}
              </div>
            </div>
              {listingOptionRows.length > 0 ? (
              <DashboardListingCreateForm
                listingOptions={listingOptionRows.map((item) => ({
                  ...item,
                  displayMarketAverageLabel: formatCurrency(item.marketAveragePrice, currencyCode),
                }))}
                defaultListingPrice={defaultListingPrice}
              />
            ) : (
              <div className="empty-state">
                <p>You don&apos;t have any products ready to list.</p>
                <Link href="/dashboard/supplier" className="ghost-button">
                  Buy Stock
                </Link>
              </div>
            )}
          </section>

          <section className="card">
            <div className="card-header">
              <div className="card-header__copy">
                <h2>Items you own</h2>
                {playerModeConfig.value === "ADVANCED" ? <p>Stock ready to sell.</p> : null}
              </div>
            </div>
            <div className="table-list">
              {freeInventoryCount === 0 ? (
                <div className="empty-state">
                  All your owned stock is already for sale.
                </div>
              ) : (
                visibleInventory.map((item) => (
                  <div key={item.inventoryId} className="table-row">
                    <div className="table-row__meta table-row__meta--with-visual">
                      <ProductVisual
                        name={item.productName}
                        category={item.productCategory}
                        subcategory={item.productSubcategory}
                        imageUrl={item.productImageUrl}
                      />
                      <div>
                        <strong>{item.productName}</strong>
                        <span className="muted">
                          Stock ready to sell: {item.availableToList} - Usual price:{" "}
                          {formatPriceWithUnit(item.marketAveragePrice, item.unitLabel, currencyCode)}
                        </span>
                      </div>
                    </div>
                    <strong>{formatPriceWithUnit(item.marketAveragePrice, item.unitLabel, currencyCode)}</strong>
                  </div>
                ))
              )}
            </div>
            {freeInventoryCount > INVENTORY_PAGE_SIZE ? (
              <div className="section-row" style={{ marginTop: "1rem" }}>
                <span className="muted">
                  Page {safeInventoryPage} of {totalInventoryPages}
                </span>
                <div className="table-row__actions">
                  {safeInventoryPage > 1 ? (
                    <Link
                      href={buildDashboardHref(params, { inventoryPage: safeInventoryPage - 1 }) as Route}
                      className="ghost-button"
                      scroll={false}
                    >
                      Previous
                    </Link>
                  ) : null}
                  {hasNextInventoryPage ? (
                    <Link
                      href={buildDashboardHref(params, { inventoryPage: safeInventoryPage + 1 }) as Route}
                      className="ghost-button"
                      scroll={false}
                    >
                      Next
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>

          <section className="card">
            <div className="card-header">
              <div className="card-header__copy">
                <h2>Items for sale</h2>
                {playerModeConfig.showDetailedHelpers ? (
                  <p>Manage prices, pauses, and sold-out items.</p>
                ) : null}
              </div>
              <div className="card-toolbar">
                {playerModeConfig.showAdvancedControls ? (
                  <>
                    <BulkListingVisibilityControls
                      activeListingCount={activeListingCount}
                      pausedListingCount={pausedListingCount}
                    />
                    <BulkSoldOutCleanup soldOutCount={soldOutListingCount} />
                  </>
                ) : null}
              </div>
            </div>
            {visibleListings.length === 0 ? (
              <div className="empty-state">
                  You have not put any items up for sale yet.
              </div>
            ) : (
              <div className="table-list">
                {visibleListings.map((listing) => (
                  <div key={listing.id} className="table-row">
                    <div className="table-row__meta table-row__meta--with-visual">
                      <ProductVisual
                        name={listing.product.name}
                        category={listing.product.category}
                        subcategory={listing.product.subcategory}
                        imageUrl={listing.product.imageUrl}
                      />
                      <div>
                        <strong>{listing.product.name}</strong>
                        <span className="muted">
                          {getProductCategoryLabel(
                            listing.product.category,
                            listing.product.subcategory,
                          )} -{" "}
                          {formatPriceWithUnit(listing.price, listing.product.unitLabel, currencyCode)} -{" "}
                          {listing.isPaused ? "Paused" : getLiveStockStatusMessage(listing.quantity)}
                        </span>
                        {listing.quantity <= 0 ? (
                          <span className="muted">Auto-removes in about 20 min if not restocked.</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="table-row__actions table-row__actions--listing-manage">
                      <DashboardListingManageForm
                        listingId={listing.id}
                        productId={listing.productId}
                        defaultPrice={formatCurrencyInputValue(listing.price, currencyCode)}
                        isPaused={listing.isPaused}
                      />
                      {listing.quantity <= 0 ? (
                        <SoldOutListingActions
                          listingId={listing.id}
                          productName={listing.product.name}
                        />
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {totalListingsPages > 1 ? (
              <div className="section-row" style={{ marginTop: "1rem" }}>
                <span className="muted">Page {safeListingsPage} of {totalListingsPages}</span>
                <div className="table-row__actions">
                  {safeListingsPage > 1 ? (
                    <Link
                      href={buildDashboardHref(params, { listingsPage: safeListingsPage - 1 }) as Route}
                      className="ghost-button"
                      scroll={false}
                    >
                      Previous
                    </Link>
                  ) : null}
                  {hasNextListingsPage ? (
                    <Link
                      href={buildDashboardHref(params, { listingsPage: safeListingsPage + 1 }) as Route}
                      className="ghost-button"
                      scroll={false}
                    >
                      Next
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <div className="stack">
          <section className="card">
            <div className="card-header">
              <div className="card-header__copy">
                <h2>Challenges</h2>
                {playerModeConfig.value === "LITTLE" ? null : (
                  <p>
                    {challengeSet.playerModeLabel}. Stage: {challengeSet.stage}.
                  </p>
                )}
              </div>
              <ChallengeCountdown
                key={challengeSet.cycleEndsAt.toISOString()}
                cycleEndsAt={challengeSet.cycleEndsAt.toISOString()}
                initialSeconds={challengeSet.secondsRemaining}
              />
            </div>
            <div className="challenge-preview-summary">
              <strong>
                {completedChallenges} / {challengeSet.challenges.length} complete
              </strong>
              <Link href={"/challenges" as Route} className="ghost-button">
                View Challenges
              </Link>
            </div>
            <div className="challenge-list">
              {previewChallenges.map((challenge) => (
                <div key={challenge.key} className="challenge-row">
                  <div className="challenge-row__header">
                    <div className="table-row__meta">
                      <strong>{challenge.label}</strong>
                      <span className="muted">
                        {challenge.completed ? "Completed" : challenge.progressLabel}
                      </span>
                    </div>
                    <div className="challenge-row__badges">
                      <span className="tag">{challenge.difficulty}</span>
                      <span className={challenge.rewarded ? "tag challenge-row__rewarded" : "tag"}>
                        {challenge.rewarded ? "Rewarded" : `Reward ${challenge.rewardLabel}`}
                      </span>
                    </div>
                  </div>
                  <div className="challenge-progress" aria-hidden="true">
                    <span style={{ width: `${Math.round(challenge.ratio * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="card-header">
              <div className="card-header__copy">
                <h2>Recent sales</h2>
              </div>
            </div>
            {recentSales.length === 0 ? (
              <div className="empty-state">No sales yet. Once customers buy from you, sales will appear here.</div>
            ) : (
              <div className="table-list">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="table-row">
                    <div className="table-row__meta table-row__meta--with-visual">
                      {sale.lineItems[0] ? (
                        <ProductVisual
                          name={sale.lineItems[0].product.name}
                          category={sale.lineItems[0].product.category}
                          subcategory={sale.lineItems[0].product.subcategory}
                          imageUrl={sale.lineItems[0].product.imageUrl}
                        />
                      ) : null}
                      <div>
                        <strong>{sale.buyer.displayName}</strong>
                        <span className="muted">
                          {sale.lineItems.map((line) => `${line.quantity}x ${line.product.name}`).join(", ")}
                        </span>
                      </div>
                    </div>
                    <div className="stack-xs align-end">
                      <strong>{formatCurrency(sale.lineItems.reduce((sum, line) => sum + line.lineProfit, 0), currencyCode)} profit</strong>
                      <span className="muted">{formatCurrency(sale.totalPrice, currencyCode)} revenue</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <div className="card-header">
              <div className="card-header__copy">
                <h2>Best-selling items</h2>
              </div>
            </div>
            {bestSellers.length === 0 ? (
              <div className="empty-state">Sales insights will appear once orders come in.</div>
            ) : (
              <div className="best-seller-list">
                {bestSellers.map((item) => (
                  <div key={item.name} className="best-seller-row">
                    <div className="table-row__meta table-row__meta--with-visual">
                      <ProductVisual
                        name={item.name}
                        category={item.category}
                        subcategory={item.subcategory}
                        imageUrl={item.imageUrl}
                      />
                      <div>
                        <strong>{item.name}</strong>
                        <span className="muted">{item.units} units sold</span>
                      </div>
                    </div>
                    <div className="best-seller-row__sales stack-xs">
                      <strong>{formatCurrency(item.profitCents, currencyCode)}</strong>
                      <span className="muted">{formatCurrency(item.revenueCents, currencyCode)} revenue</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <div className="card-header">
              <div className="card-header__copy">
                <h2>Low-stock alerts</h2>
              </div>
            </div>
            {lowStockListings.length === 0 ? (
              <div className="empty-state">No low-stock listings right now.</div>
            ) : (
              <div className="table-list">
                {lowStockListings.map((listing) => (
                  <div key={listing.id} className="table-row">
                    <div className="table-row__meta table-row__meta--with-visual">
                      <ProductVisual
                        name={listing.product.name}
                        category={listing.product.category}
                        subcategory={listing.product.subcategory}
                        imageUrl={listing.product.imageUrl}
                      />
                      <div>
                        <strong>{listing.product.name}</strong>
                        <span className="muted">
                          {getLiveStockStatusMessage(listing.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card leaderboard-card">
            <div className="card-header">
              <div className="card-header__copy">
                <h2>Shop leaderboard</h2>
              </div>
              <span className="tag">Top revenue</span>
            </div>
            <div className="leaderboard-list">
              {leaderboardShops.map((shop, index) => (
                <div key={shop.id} className={shop.id === currentShopId ? "leaderboard-row leaderboard-row--you" : "leaderboard-row"}>
                  <span className="leaderboard-rank">#{index + 1}</span>
                  <div>
                    <strong>{shop.name}</strong>
                    <small>{shop.totalSales} sales - rating {shop.rating.toFixed(1)}</small>
                  </div>
                  <strong>{formatCurrency(shop.totalRevenue, currencyCode)}</strong>
                </div>
              ))}
            </div>
          </section>

        </div>
      </section>
    </div>
  );
}

function getStarterMissions({
  hasInventory,
  activeListingCount,
  totalSales,
  totalProfit,
  currencyCode,
}: {
  hasInventory: boolean;
  activeListingCount: number;
  totalSales: number;
  totalProfit: number;
  currencyCode: string;
}) {
  return [
    {
      title: "Buy your first stock",
      helper: "Pick something cheap, add it to your cart, and stock your shop.",
      action: "Buy stock",
      href: "/dashboard/supplier",
      reward: `Task rewards can pay ${formatCurrency(5_000, currencyCode)}.`,
      complete: hasInventory || activeListingCount > 0 || totalSales > 0,
    },
    {
      title: "List it for sale",
      helper: "Put owned stock into your shop so customers can buy it.",
      action: "Create listing",
      href: "/dashboard",
      reward: `Complete listing tasks for ${formatCurrency(5_000, currencyCode)}+ rewards.`,
      complete: activeListingCount > 0 || totalSales > 0,
    },
    {
      title: "Make your first profit",
      helper: "Bots and players can buy your items once they are live.",
      action: "View goals",
      href: "/challenges",
      reward: "Unlock XP, challenge rewards, and higher shop levels.",
      complete: totalSales > 0 || totalProfit > 0,
    },
  ];
}

function getWinProgress(totalProfit: number, activeListings: number, level: number) {
  const profitScore = Math.min(55, Math.max(0, totalProfit) / 1_000_000 * 55);
  const listingScore = Math.min(20, activeListings / 25 * 20);
  const levelScore = Math.min(25, level / PLAYER_LEVELS.length * 25);
  return Math.max(3, Math.round(profitScore + listingScore + levelScore));
}

function getProgression(totalXp: number) {
  const xp = Math.max(0, Math.floor(totalXp));
  let currentIndex = 0;
  for (let index = 0; index < PLAYER_LEVELS.length; index += 1) {
    if (xp >= PLAYER_LEVELS[index].xp) {
      currentIndex = index;
    }
  }
  const current = PLAYER_LEVELS[currentIndex];
  const next = PLAYER_LEVELS[currentIndex + 1] ?? null;
  const progress = next
    ? Math.min(100, Math.round(((xp - current.xp) / (next.xp - current.xp)) * 100))
    : 100;

  return {
    xp,
    level: currentIndex + 1,
    title: current.name,
    nextTitle: next?.name ?? "Max level",
    atMaxLevel: !next,
    progress,
    xpToNext: next ? Math.max(0, next.xp - xp) : 0,
  };
}
