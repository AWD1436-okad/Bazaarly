import { CategoryFilterList } from "@/components/category-filter-list";
import { DailyFeatureCard } from "@/components/daily-feature-card";
import { ListingCard } from "@/components/listing-card";
import { SimulationHeartbeat } from "@/components/simulation-heartbeat";
import { StatusBanner } from "@/components/status-banner";
import { CATEGORY_OPTIONS, getDailyFeaturedProduct } from "@/lib/catalog";
import { getMarketplaceData } from "@/lib/marketplace";

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
  const params = (await searchParams) ?? {};
  const featuredProduct = getDailyFeaturedProduct();
  const selectedCategory =
    typeof params.category === "string" && params.category !== "ALL" ? params.category : "ALL";
  const selectedCategoryLabel =
    CATEGORY_OPTIONS.find((category) => category.value === selectedCategory)?.label ?? "All Products";
  const marketplace = await getMarketplaceData({
    q: typeof params.q === "string" ? params.q : undefined,
    sort: typeof params.sort === "string" ? params.sort : undefined,
    category: typeof params.category === "string" ? params.category : undefined,
    stock: typeof params.stock === "string" ? params.stock : undefined,
    minRating: typeof params.minRating === "string" ? params.minRating : undefined,
    minPrice: typeof params.minPrice === "string" ? params.minPrice : undefined,
    maxPrice: typeof params.maxPrice === "string" ? params.maxPrice : undefined,
    page: typeof params.page === "string" ? params.page : undefined,
  });

  return (
    <div className="page-grid marketplace-page">
      <SimulationHeartbeat intervalMs={180000} initialDelayMs={15000} />
      <section className="marketplace-showcase">
        <div className="marketplace-showcase__header">
          <h1>Daily Featured Item</h1>
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
          href={`/marketplace?q=${encodeURIComponent(featuredProduct.name)}&category=${featuredProduct.category}`}
          ctaLabel="See Offer"
        />
      </section>

      <section className="card marketplace-filters-card">
        <div className="marketplace-filter-layout">
          <aside className="category-sidebar">
            <CategoryFilterList
              categories={CATEGORY_OPTIONS}
              selectedCategory={selectedCategory === "ALL" ? null : selectedCategory}
              buildHref={(category) => buildMarketplaceHref(params, category)}
            />
          </aside>

          <form action="/marketplace" className="marketplace-filters">
            {selectedCategory !== "ALL" ? (
              <input type="hidden" name="category" value={selectedCategory} />
            ) : null}
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
            <label>
              In stock only
              <select name="stock" defaultValue={typeof params.stock === "string" ? params.stock : ""}>
                <option value="">Any</option>
                <option value="in">In stock</option>
              </select>
            </label>
            <button type="submit">Apply filters</button>
          </form>
        </div>
      </section>

      <section className="page-header marketplace-results-header">
        <h2>{selectedCategoryLabel}</h2>
        <p>{marketplace.listings.length} matching listings</p>
      </section>

      {marketplace.listings.length === 0 ? (
        <div className="empty-state">
          No listings match those search terms or filters right now.
        </div>
      ) : (
        <>
          <section className="listing-grid listing-grid--list">
            {marketplace.listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </section>
        </>
      )}

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
    </div>
  );
}
