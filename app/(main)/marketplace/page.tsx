import Link from "next/link";

import { ListingCard } from "@/components/listing-card";
import { SimulationHeartbeat } from "@/components/simulation-heartbeat";
import { StatusBanner } from "@/components/status-banner";
import { getMarketplaceData } from "@/lib/marketplace";

type MarketplacePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const params = (await searchParams) ?? {};
  const marketplace = await getMarketplaceData({
    q: typeof params.q === "string" ? params.q : undefined,
    sort: typeof params.sort === "string" ? params.sort : undefined,
    category: typeof params.category === "string" ? params.category : undefined,
    stock: typeof params.stock === "string" ? params.stock : undefined,
    minRating: typeof params.minRating === "string" ? params.minRating : undefined,
    minPrice: typeof params.minPrice === "string" ? params.minPrice : undefined,
    maxPrice: typeof params.maxPrice === "string" ? params.maxPrice : undefined,
  });

  return (
    <div className="page-grid">
      <SimulationHeartbeat intervalMs={180000} initialDelayMs={15000} />
      <section className="hero-card">
        <div className="stack">
          <span className="tag">Marketplace</span>
          <h1>Browse live listings from the whole Bazaarly world.</h1>
          <p>
            Buyers mostly see products first, then compare shops by price, stock, and
            rating. That keeps the economy competitive and readable.
          </p>

          {marketplace.activeEvent ? (
            <StatusBanner
              tone="warning"
              title={marketplace.activeEvent.name}
              body={marketplace.activeEvent.description}
            />
          ) : null}
        </div>

        <div className="hero-card__aside">
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
                  <Link href={`/shop/${shop.id}`}>{shop.name}</Link>
                  <span>{shop.rating.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <form action="/marketplace" className="filters-grid">
          <label>
            Category
            <select name="category" defaultValue={typeof params.category === "string" ? params.category : "ALL"}>
              <option value="ALL">All</option>
              <option value="FOOD">Food</option>
              <option value="DRINKS">Drinks</option>
              <option value="KITCHEN">Kitchen</option>
              <option value="CLOTHES">Clothes</option>
              <option value="ESSENTIALS">Essentials</option>
            </select>
          </label>
          <label>
            Minimum rating
            <select name="minRating" defaultValue={typeof params.minRating === "string" ? params.minRating : ""}>
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
      </section>

      <section className="page-header">
        <h1>{marketplace.listings.length} live listings</h1>
        <p>
          Search matches product names, shop names, categories, and keywords.
          Results are then sorted by the control in the top bar.
        </p>
      </section>

      {marketplace.listings.length === 0 ? (
        <div className="empty-state">
          No listings match those search terms or filters right now.
        </div>
      ) : (
        <section className="listing-grid">
          {marketplace.listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </section>
      )}
    </div>
  );
}
