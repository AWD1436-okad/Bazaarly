import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/money";
import { getShopPageData } from "@/lib/marketplace";

type ShopPageProps = {
  params: Promise<{ shopId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function parsePositivePage(value: string | string[] | undefined) {
  const parsed = Number(typeof value === "string" ? value : "1");
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

function buildShopHref(shopId: string, page: number) {
  return page <= 1 ? `/shop/${shopId}` : `/shop/${shopId}?page=${page}`;
}

export default async function ShopPage({ params, searchParams }: ShopPageProps) {
  await requireUser();
  const { shopId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const page = parsePositivePage(resolvedSearchParams?.page);
  const shop = await getShopPageData(shopId, page);

  if (!shop) {
    notFound();
  }

  return (
    <div className="page-grid">
      <section className="hero-card">
        <div className="stack">
          <span className="tag">{shop.categoryFocus ?? "GENERAL SHOP"}</span>
          <h1>{shop.name}</h1>
          <p>{shop.description}</p>
          <div className="section-row">
            <span>Owner: {shop.owner.displayName}</span>
            <span>Rating: {shop.rating.toFixed(1)}</span>
            <span>Total sales: {shop.totalSales}</span>
          </div>
        </div>
        <div className="hero-card__aside">
          <div
            className="hero-card__panel"
            style={{ borderTop: `4px solid ${shop.accentColor}` }}
          >
            <strong>Shop live status</strong>
            <p className="muted">
              Competes with other Bazaarly stores on price, stock, rating, and visibility.
            </p>
          </div>
        </div>
      </section>

      <section className="listing-grid">
        {shop.listings.map((listing) => (
          <article key={listing.id} className="listing-card">
            <div className="listing-card__header">
              <span className="category-chip">{listing.product.category}</span>
              <span className={`stock-chip ${listing.quantity <= 0 ? "stock-chip--soldout" : ""}`}>
                {listing.quantity <= 0 ? "Sold out" : `${listing.quantity} available`}
              </span>
            </div>
            <div className="listing-card__body">
              <h3>{listing.product.name}</h3>
              <p>{listing.product.description}</p>
            </div>
            <div className="listing-card__meta">
              <div>
                <strong>{formatCurrency(listing.price)}</strong>
                <span>{shop.name}</span>
              </div>
            </div>
            {listing.quantity > 0 ? (
              <form action="/cart/add" method="post" className="inline-cart-form">
                <input type="hidden" name="listingId" value={listing.id} />
                <input
                  type="number"
                  name="quantity"
                  min={1}
                  max={listing.quantity}
                  defaultValue={1}
                />
                <button type="submit">Add to cart</button>
              </form>
            ) : (
              <div className="inline-cart-form">
                <button type="button" disabled className="sold-out-button">
                  Sold out
                </button>
              </div>
            )}
          </article>
        ))}
      </section>
      {(shop.hasPreviousPage || shop.hasNextPage) && (
        <section className="card">
          <div className="section-row">
            <p className="muted">
              Showing shop page {shop.currentPage}
              {shop.hasNextPage ? " with more listings available." : "."}
            </p>
            <div style={{ display: "flex", gap: "1rem" }}>
              {shop.hasPreviousPage ? (
                <a href={buildShopHref(shopId, shop.currentPage - 1)}>Previous</a>
              ) : (
                <span />
              )}
              {shop.hasNextPage ? (
                <a href={buildShopHref(shopId, shop.currentPage + 1)}>Next</a>
              ) : (
                <span />
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
