import { Prisma, ProductCategory } from "@prisma/client";
import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BulkListingVisibilityControls } from "@/components/bulk-listing-visibility-controls";
import { BulkSoldOutCleanup } from "@/components/bulk-sold-out-cleanup";
import { ChallengeCountdown } from "@/components/challenge-countdown";
import { CurrencyDisplayNote } from "@/components/currency-display-note";
import { DashboardListingCreateForm } from "@/components/dashboard-listing-create-form";
import { DashboardListingManageForm } from "@/components/dashboard-listing-manage-form";
import { ProductVisual } from "@/components/product-visual";
import { SoldOutListingActions } from "@/components/sold-out-listing-actions";
import { SimulationHeartbeat } from "@/components/simulation-heartbeat";
import { StatusBanner } from "@/components/status-banner";
import { getProductCategoryLabel } from "@/lib/catalog";
import { requireUser } from "@/lib/auth";
import { getDashboardChallenges } from "@/lib/challenges";
import { convertAudCentsToCurrencyMinorUnits, formatCurrency, formatPriceWithUnit } from "@/lib/money";
import { getActiveCurrencyCode, getPriceProfileMetadata } from "@/lib/price-profiles";
import { prisma } from "@/lib/prisma";
import { sanitizeStockCount, getLiveStockStatusMessage } from "@/lib/stock";

const INVENTORY_PAGE_SIZE = 3;
const LISTING_PAGE_SIZE = 3;
const LISTING_OPTION_LIMIT = 40;

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
  units: number;
  profit: number;
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

  if (!user.shop) {
    redirect("/onboarding/shop");
  }

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
    unreadAlerts,
    bestSellerRows,
    inventoryPresence,
    todayProfitSummary,
    totalProfitSummary,
    soldOutListingCount,
    listingTotalCount,
    activeListingCount,
    pausedListingCount,
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
      prisma.notification.findMany({
        where: {
          userId: user.id,
          read: false,
          type: { in: ["LOW_STOCK", "SALE"] },
        },
        select: {
          id: true,
          type: true,
          message: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.$queryRaw<BestSellerRow[]>(Prisma.sql`
        SELECT
          oli."productId" AS "productId",
          p."name" AS "productName",
          COALESCE(SUM(oli."quantity"), 0)::int AS "units",
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
        WHERE o."sellerId" = ${user.id}
        GROUP BY oli."productId", p."name"
        ORDER BY SUM(oli."quantity") DESC, SUM(
          (oli."unitPrice" - COALESCE(NULLIF(inv."averageUnitCost", 0), p."basePrice")) * oli."quantity"
        ) DESC
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
        WHERE o."sellerId" = ${user.id}
          AND o."createdAt" >= ${startOfToday}
          AND o."createdAt" < ${endOfToday}
      `),
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
        WHERE o."sellerId" = ${user.id}
      `),
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
      ? (
          convertAudCentsToCurrencyMinorUnits(listingOptionRows[0].marketAveragePrice, currencyCode) /
          10 ** getPriceProfileMetadata(currencyCode).fractionDigits
        ).toFixed(getPriceProfileMetadata(currencyCode).fractionDigits)
      : "2.50";
  const todayProfit = todayProfitSummary[0]?.profit ?? 0;
  const totalProfit = totalProfitSummary[0]?.profit ?? 0;

  const hasListings = visibleListings.some((listing) => listing.quantity > 0);
  const hasInventory = Boolean(inventoryPresence);
  const bestSellers = bestSellerRows.map((item) => ({
    name: item.productName,
    units: item.units,
    profit: item.profit,
  }));
  const challengeSet = await getDashboardChallenges({
    userId: user.id,
    shopId: user.shop.id,
    currencyCode,
    activeListingCount,
  });
  const completedChallenges = challengeSet.challenges.filter((challenge) => challenge.completed).length;
  const previewChallenges = challengeSet.challenges.slice(0, 2);

  if (safeInventoryPage !== inventoryPage) {
    redirect(buildDashboardHref(params, { inventoryPage: safeInventoryPage }) as Route);
  }

  if (safeListingsPage !== listingsPage) {
    redirect(buildDashboardHref(params, { listingsPage: safeListingsPage }) as Route);
  }

  return (
    <div className="page-grid">
      <SimulationHeartbeat intervalMs={70000} initialDelayMs={12000} />
      {welcome ? (
        <StatusBanner
          tone="success"
          title="Your shop is ready."
          body="Step 1: Review your starter stock. Step 2: Create your first listing so shoppers can find you."
          action={
            <Link href="/dashboard/supplier" className="ghost-button">
              Open Supplier
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
          body="This shop needs stocked inventory before you can publish more listings."
          action={
            <Link href="/dashboard/supplier" className="ghost-button">
              Open Supplier
            </Link>
          }
        />
      ) : null}
      {user.balance < 50000 ? (
        <StatusBanner
          tone="warning"
          title="Low balance warning"
          body={`Your balance is ${formatCurrency(
            user.balance,
            currencyCode,
          )}. Restock carefully to avoid cancelled subscriptions or failed checkouts.`}
        />
      ) : null}

      <section className="page-header">
        <h1>{user.shop.name}</h1>
        <p>
          Manage inventory, publish listings, and monitor sales from the same seller dashboard.
        </p>
        <CurrencyDisplayNote currencyCode={currencyCode} />
      </section>

      <section className="metrics-grid">
        <article className="metric-card">
          <span className="metric-card__eyebrow">Balance</span>
          <strong>{formatCurrency(user.balance, currencyCode)}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-card__eyebrow">Today Profit</span>
          <strong>{formatCurrency(todayProfit, currencyCode)}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-card__eyebrow">Total Profit</span>
          <strong>{formatCurrency(totalProfit, currencyCode)}</strong>
        </article>
      </section>

      <section className="dashboard-grid">
        <div className="stack">
          <section className="card">
            <div className="card-header">
              <div className="card-header__copy">
                <h2>Create or update a listing</h2>
                <p>
                  Pick an inventory item you own and publish it live. Tradex will move
                  all free units for that product into your active listing automatically.
                </p>
              </div>
              <div className="card-toolbar">
                <Link href="/dashboard/supplier" className="ghost-button">
                  Open supplier
                </Link>
                <form action="/listings/list-all" method="post">
                  <button type="submit">List all products</button>
                </form>
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
                  Open supplier
                </Link>
              </div>
            )}
          </section>

          <section className="card">
            <div className="card-header">
              <div className="card-header__copy">
                <h2>Inventory</h2>
                <p>This section only shows stock that is not currently live in your shop.</p>
              </div>
            </div>
            <div className="table-list">
              {freeInventoryCount === 0 ? (
                <div className="empty-state">
                  All of your stock is currently moved into active listings.
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
                          Available in inventory: {item.availableToList} - Market average:{" "}
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
                <h2>Shop listings</h2>
                <p>Manage live listings, clean out sold-out rows, and keep your shop tidy.</p>
              </div>
              <div className="card-toolbar">
                <BulkListingVisibilityControls
                  activeListingCount={activeListingCount}
                  pausedListingCount={pausedListingCount}
                />
                <BulkSoldOutCleanup soldOutCount={soldOutListingCount} />
              </div>
            </div>
            {visibleListings.length === 0 ? (
              <div className="empty-state">
                You have not published any listings yet.
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
                    <div className="table-row__actions">
                      {listing.quantity > 0 ? (
                        <>
                          <DashboardListingManageForm
                            listingId={listing.id}
                            productId={listing.productId}
                            defaultPrice={(
                              convertAudCentsToCurrencyMinorUnits(listing.price, currencyCode) /
                              10 ** getPriceProfileMetadata(currencyCode).fractionDigits
                            ).toFixed(getPriceProfileMetadata(currencyCode).fractionDigits)}
                            isPaused={listing.isPaused}
                          />
                        </>
                      ) : (
                        <SoldOutListingActions
                          listingId={listing.id}
                          productName={listing.product.name}
                        />
                      )}
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
                <p>Short trading tasks refresh every five minutes.</p>
              </div>
              <ChallengeCountdown cycleEndsAt={challengeSet.cycleEndsAt.toISOString()} />
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
                <p>The latest orders update here automatically as your shop sells.</p>
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
                    <strong>{formatCurrency(sale.totalPrice, currencyCode)}</strong>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <div className="card-header">
              <div className="card-header__copy">
                <h2>Best-selling items</h2>
                <p>Your strongest sellers, ranked by completed sales and profit.</p>
              </div>
            </div>
            {bestSellers.length === 0 ? (
              <div className="empty-state">Sales insights will appear once orders come in.</div>
            ) : (
              <div className="table-list">
                {bestSellers.map((item) => (
                  <div key={item.name} className="table-row">
                    <div className="table-row__meta table-row__meta--with-visual">
                      <ProductVisual name={item.name} />
                      <div>
                        <strong>{item.name}</strong>
                        <span className="muted">{item.units} units sold</span>
                      </div>
                    </div>
                    <strong>{formatCurrency(item.profit, currencyCode)}</strong>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <div className="card-header">
              <div className="card-header__copy">
                <h2>Low-stock alerts</h2>
                <p>Catch items that are nearly gone before they disappear from your shop.</p>
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

          <section className="card">
            <div className="card-header">
              <div className="card-header__copy">
                <h2>Alerts</h2>
                <p>Your latest unread sale and stock updates in one place.</p>
              </div>
            </div>
            <div className="table-list">
              {unreadAlerts.length === 0 ? (
                <div className="empty-state">No unread alerts right now.</div>
              ) : (
                unreadAlerts.map((notification) => (
                  <div key={notification.id} className="notification-row unread">
                    <strong>{notification.type.replace("_", " ")}</strong>
                    <p className="muted">{notification.message}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
