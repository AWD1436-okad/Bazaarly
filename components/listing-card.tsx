import type { ProductCategory } from "@prisma/client";
import Link from "next/link";

import { getCategoryLabel } from "@/lib/catalog";
import { formatPriceWithUnit } from "@/lib/money";
import { ProductVisual } from "@/components/product-visual";

type ListingCardProps = {
  listing: {
    id: string;
    price: number;
    quantity: number;
    shopId: string;
    product: {
      name: string;
      category: ProductCategory;
      unitLabel: string;
      description: string;
    };
    shop: {
      name: string;
      rating: number;
    };
  };
};

export function ListingCard({ listing }: ListingCardProps) {
  return (
    <article className="listing-card">
      <div className="listing-card__summary">
        <div className="listing-card__media" aria-hidden="true">
          <ProductVisual
            name={listing.product.name}
            category={listing.product.category}
            tone="card"
          />
        </div>

        <div className="listing-card__copy">
          <div className="listing-card__header">
            <div className="listing-card__title-block">
              <h3>{listing.product.name}</h3>
              <span className="listing-card__subline">
                {formatPriceWithUnit(listing.price, listing.product.unitLabel)}
              </span>
            </div>

            <div className="listing-card__price">
              <strong>{formatPriceWithUnit(listing.price, listing.product.unitLabel)}</strong>
              <span>{listing.quantity} in stock</span>
            </div>
          </div>

          <div className="listing-card__meta">
            <div className="listing-card__tags">
              <span className="category-chip">{getCategoryLabel(listing.product.category)}</span>
            </div>
            <span className="listing-card__shop">
              {listing.shop.name} • Rated {listing.shop.rating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      <div className="listing-card__actions">
        <Link href={`/shop/${listing.shopId}`} className="ghost-button">
          View Shop
        </Link>
        <form action="/cart/add" method="post" className="inline-cart-form">
          <input type="hidden" name="listingId" value={listing.id} />
          <input type="number" name="quantity" min={1} max={listing.quantity} defaultValue={1} />
          <button type="submit">Add to cart</button>
        </form>
      </div>
    </article>
  );
}
