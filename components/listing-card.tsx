import Link from "next/link";
import { formatCurrency } from "@/lib/money";

type ListingCardProps = {
  listing: {
    id: string;
    price: number;
    quantity: number;
    shopId: string;
    product: {
      name: string;
      category: string;
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
      <div className="listing-card__header">
        <span className="category-chip">{listing.product.category}</span>
        <span className="stock-chip">{listing.quantity} in stock</span>
      </div>

      <div className="listing-card__body">
        <h3>{listing.product.name}</h3>
        <p>{listing.product.description}</p>
      </div>

      <div className="listing-card__meta">
        <div>
          <strong>{formatCurrency(listing.price)}</strong>
          <span>{listing.shop.name}</span>
        </div>
        <div>
          <span>Rating</span>
          <strong>{listing.shop.rating.toFixed(1)}</strong>
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
