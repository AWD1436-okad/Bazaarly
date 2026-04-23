import type { ProductCategory } from "@prisma/client";
import Link from "next/link";

import { InlineCartActions } from "@/components/inline-cart-actions";
import { getCategoryLabel } from "@/lib/catalog";
import { formatPriceWithUnit } from "@/lib/money";
import { getStockAvailabilityLabel, sanitizeStockCount } from "@/lib/stock";

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
  showShopLink?: boolean;
  shopNameOverride?: string;
};

export function ListingCard({
  listing,
  showShopLink = true,
  shopNameOverride,
}: ListingCardProps) {
  const shopLabel = shopNameOverride ?? listing.shop.name;

  return (
    <article className="card supplier-card listing-card">
      <div className="listing-card__header">
        <div className="supplier-card__title">
          <span className="category-chip">{getCategoryLabel(listing.product.category)}</span>
          <h3>{listing.product.name}</h3>
          <span className="listing-card__shop">
            {shopLabel} {" - "}Rated {listing.shop.rating.toFixed(1)}
          </span>
        </div>

        <div className="listing-card__price">
          <strong>{formatPriceWithUnit(listing.price, listing.product.unitLabel)}</strong>
          <span>{getStockAvailabilityLabel(listing.quantity)}</span>
        </div>
      </div>

      <p className="listing-card__description">{listing.product.description}</p>

      <div className="supplier-card__meta listing-card__meta-grid">
        <span className="muted">Unit basis</span>
        <strong>{listing.product.unitLabel}</strong>
        <span className="muted">Shop stock</span>
        <strong>{sanitizeStockCount(listing.quantity)}</strong>
      </div>

      <div className="listing-card__actions">
        {showShopLink ? (
          <Link href={`/shop/${listing.shopId}`} className="ghost-button">
            View Shop
          </Link>
        ) : (
          <span className="muted listing-card__inline-note">Buying from this shop</span>
        )}
        <InlineCartActions listingId={listing.id} maxQuantity={listing.quantity} />
      </div>
    </article>
  );
}
