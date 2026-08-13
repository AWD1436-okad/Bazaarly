import { CategoryFilterList } from "@/components/category-filter-list";
import { ListingCard } from "@/components/listing-card";
import { SimulationHeartbeat } from "@/components/simulation-heartbeat";
import { StatusBanner } from "@/components/status-banner";
import { requireUser } from "@/lib/auth";
import { CATEGORY_OPTIONS, getCategoryFilterLabel } from "@/lib/catalog";
import { getMarketplaceData } from "@/lib/marketplace";
import { getPlayerModeConfig } from "@/lib/player-mode";
import { getActiveCurrencyCode } from "@/lib/price-profiles";
import { prepareNpcShopsForSharedSupplier } from "@/lib/simulation";

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
  await prepareNpcShopsForSharedSupplier(new Date());
  const currencyCode = await getActiveCurrencyCode(user.id);
  const playerModeConfig = getPlayerModeConfig("ADVANCED");
  const params = (await searchParams) ?? {};
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
      <section className="card marketplace-filters-card">
        <div className="marketplace-filter-layout">
          <form action="/marketplace" className="marketplace-filters">
            {selectedCategory !== "ALL" ? (
              <input type="hidden" name="category" value={selectedCategory} />
            ) : null}
            <label>
              Search
              <input
                name="q"
                type="search"
                placeholder="Search products or shops"
                defaultValue={typeof params.q === "string" ? params.q : ""}
              />
            </label>
            <label>
              Sort
              <select name="sort" defaultValue={typeof params.sort === "string" ? params.sort : "relevance"}>
                <option value="relevance">Best match</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>
            </label>
            <button type="submit">Search</button>
          </form>
          <details className="category-disclosure">
            <summary>Show categories</summary>
            <div className="category-disclosure__content">
              <CategoryFilterList
                categories={CATEGORY_OPTIONS}
                selectedCategory={selectedCategory === "ALL" ? null : selectedCategory}
                buildHref={(category) => buildMarketplaceHref(params, category)}
              />
            </div>
          </details>
        </div>
      </section>

      <section className="page-header marketplace-results-header">
        <h2>{selectedCategoryLabel}</h2>
        <span className="tag">
          {marketplace.listings.length} matching listings
          {hasQuery
            ? ` for "${queryText}"`
            : ""}
        </span>
      </section>

      {hasQuery && marketplace.searchSummary?.showingClosestMatches ? (
        <StatusBanner
          tone="warning"
          title="Showing closest matches"
          body={`No exact title match for "${marketplace.searchSummary.query}", so these are the nearest results.`}
        />
      ) : null}

      {marketplace.listings.length === 0 ? (
        <div className="empty-state">
          <p>No listings found.</p>
          <p className="muted">Try fewer words or choose another category.</p>
        </div>
      ) : (
        <>
          <section className="listing-grid listing-grid--list">
            {marketplace.listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} currencyCode={currencyCode} viewerUserId={user.id} />
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
