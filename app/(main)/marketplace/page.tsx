import { CategoryFilterList } from "@/components/category-filter-list";
import { CurrencyDisplayNote } from "@/components/currency-display-note";
import { DailyFeatureCard } from "@/components/daily-feature-card";
import { ListingCard } from "@/components/listing-card";
import { SimulationHeartbeat } from "@/components/simulation-heartbeat";
import { StatusBanner } from "@/components/status-banner";
import { requireUser } from "@/lib/auth";
import { CATEGORY_OPTIONS, getCategoryFilterLabel, getDailyFeaturedProduct } from "@/lib/catalog";
import { getMarketplaceData } from "@/lib/marketplace";
import { getPlayerModeConfig } from "@/lib/player-mode";
import { getActiveCurrencyCode } from "@/lib/price-profiles";

type MarketplacePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function buildMarketplaceHref(
  params: Record<string, string | string[] | undefined>,
  category: string | null,
) {
  const nextParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === "string" && key !== "category" && key !== "page" && value.trim()) {
      nextParams.set(key, value);
    }
  });

  if (category) {
    nextParams.set("category", category);
  }

  const query = nextParams.toString();

  return query ? `/marketplace?${query}` : "/marketplace";
}

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const user = await requireUser();
  const currencyCode = await getActiveCurrencyCode(user.id);
  const playerModeConfig = getPlayerModeConfig((user as { playerMode?: unknown }).playerMode);
  const params = (await searchParams) ?? {};
  const featuredProduct = getDailyFeaturedProduct();
  const selectedCategory =
    typeof params.category === "string" && params.category !== "ALL" ? params.category : "ALL";
  const hasActiveMarketplaceSearch =
    (typeof params.q === "string" && params.q.trim().length > 0) ||
    (typeof params.category === "string" && params.category !== "ALL") ||
    (typeof params.stock === "string" && params.stock.length > 0) ||
    (typeof params.minRating === "string" && params.minRating.length > 0) ||
    (typeof params.minPrice === "string" && params.minPrice.length > 0) ||
    (typeof params.maxPrice === "string" && params.maxPrice.length > 0);
  const queryText = typeof params.q === "string" ? params.q.trim() : "";
  const hasQuery = queryText.length > 0;
  const selectedCategoryLabel = getCategoryFilterLabel(selectedCategory);
  const marketplace = await getMarketplaceData({
    q: typeof params.q === "string" ? params.q : undefined,
    sort: typeof params.sort === "string" ? params.sort : undefined,
    category: typeof params.category === "string" ? params.category : undefined,
    stock: typeof params.stock === "string" ? params.stock : undefined,
    minRating: typeof params.minRating === "string" ? params.minRating : undefined,
    minPrice: typeof params.minPrice === "string" ? params.minPrice : undefined,
    maxPrice: typeof params.maxPrice === "string" ? params.maxPrice : undefined,
    page: typeof params.page === "string" ? params.page : undefined,
    excludeOwnerId: user.id,
    currencyCode,
  });

  return (
    <div
      className={[
        "page-grid marketplace-page",
        playerModeConfig.bodyClass,
        hasActiveMarketplaceSearch ? "marketplace-page--focused" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <SimulationHeartbeat intervalMs={70000} initialDelayMs={12000} />
      {!hasActiveMarketplaceSearch ? (
        <section className="marketplace-showcase">
          <div className="marketplace-showcase__header">
            <h1>{playerModeConfig.value === "LITTLE" ? "Pick Something" : "Daily Featured Item"}</h1>
          </div>

          {marketplace.activeEvent ? (
            <StatusBanner
              tone="warning"
              title={marketplace.activeEvent.name}
              body={marketplace.activeEvent.description}
            />
          ) : null}

          <DailyFeatureCard
            product={featuredProduct}
            displayPrice={featuredProduct.basePrice}
            displayUnitLabel={featuredProduct.unitLabel}
            currencyCode={currencyCode}
            href={`/marketplace?q=${encodeURIComponent(featuredProduct.name)}&category=${featuredProduct.category}`}
            ctaLabel={playerModeConfig.value === "LITTLE" ? "See" : "See Offer"}
          />
        </section>
      ) : null}

      <section className="card marketplace-filters-card">
        <div className="marketplace-filter-layout">
          {playerModeConfig.value === "LITTLE" ? null : (
            <aside className="category-sidebar">
              <CategoryFilterList
                categories={CATEGORY_OPTIONS}
                selectedCategory={selectedCategory === "ALL" ? null : selectedCategory}
                buildHref={(category) => buildMarketplaceHref(params, category)}
              />
            </aside>
          )}

          <form action="/marketplace" className="marketplace-filters">
            {selectedCategory !== "ALL" ? (
              <input type="hidden" name="category" value={selectedCategory} />
            ) : null}
            <label>
              Search
              <input
                name="q"
                type="search"
                placeholder={playerModeConfig.value === "LITTLE" ? "Find things" : "Search products or shops"}
                defaultValue={typeof params.q === "string" ? params.q : ""}
              />
            </label>
            {playerModeConfig.value === "LITTLE" || playerModeConfig.value === "JUNIOR" ? null : (
              <>
                <label>
                  Minimum rating
                  <select
                    name="minRating"
                    defaultValue={typeof params.minRating === "string" ? params.minRating : ""}
                  >
                    <option value="">Any</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                    <option value="4.5">4.5+</option>
                  </select>
                </label>
                <label>
                  Min price
                  <input name="minPrice" type="number" step="0.01" defaultValue={typeof params.minPrice === "string" ? params.minPrice : ""} />
                </label>
                <label>
                  Max price
                  <input name="maxPrice" type="number" step="0.01" defaultValue={typeof params.maxPrice === "string" ? params.maxPrice : ""} />
                </label>
              </>
            )}
            {playerModeConfig.value === "LITTLE" ? null : (
              <label>
                In stock only
                <select name="stock" defaultValue={typeof params.stock === "string" ? params.stock : ""}>
                  <option value="">Any</option>
                  <option value="in">In stock</option>
                </select>
              </label>
            )}
            <button type="submit">{playerModeConfig.value === "LITTLE" ? "Find" : "Apply filters"}</button>
          </form>
        </div>
      </section>

      <section className="page-header marketplace-results-header">
        <h2>{selectedCategoryLabel}</h2>
        <span className="tag">
          {marketplace.listings.length} {playerModeConfig.value === "LITTLE" ? "things" : "matching listings"}
          {hasQuery
            ? ` for "${queryText}"`
            : ""}
        </span>
        <CurrencyDisplayNote currencyCode={currencyCode} />
      </section>

      {hasQuery && marketplace.searchSummary?.showingClosestMatches ? (
        <StatusBanner
          tone="warning"
          title="No exact match found"
          body={`Showing closest matches for "${marketplace.searchSummary.query}".`}
        />
      ) : null}

      {marketplace.listings.length === 0 ? (
        <div className="empty-state">
          <p>No exact match found.</p>
          {playerModeConfig.value === "LITTLE" ? null : (
            <p className="muted">Try fewer words or clear filters.</p>
          )}
        </div>
      ) : (
        <>
          <section className="listing-grid listing-grid--list">
            {marketplace.listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} currencyCode={currencyCode} />
            ))}
          </section>
        </>
      )}

      {!hasActiveMarketplaceSearch ? (
        <section className="marketplace-insights">
          <div className="hero-card__panel">
            <strong>Trending products</strong>
            <div className="stack-sm">
              {marketplace.trendingProducts.map((item) => (
                <div key={item.id} className="section-row">
                  <span>{item.product.name}</span>
                  <strong>{item.trendLabel}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-card__panel">
            <strong>Top shops</strong>
            <div className="stack-sm">
              {marketplace.topShops.map((shop) => (
                <div key={shop.id} className="section-row">
                  <span>{shop.name}</span>
                  <strong>{shop.rating.toFixed(1)}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
