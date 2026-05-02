import { type CatalogProduct, getProductCategoryLabel } from "@/lib/catalog";
import { formatPriceWithUnit } from "@/lib/money";
import { ProductVisual } from "@/components/product-visual";

type DailyFeatureCardProps = {
  product: CatalogProduct;
  href: string;
  ctaLabel: string;
  eyebrow?: string;
  displayPrice?: number;
  displayUnitLabel?: string;
  currencyCode?: string;
};

export function DailyFeatureCard({
  product,
  href,
  ctaLabel,
  eyebrow = "Today's featured item",
  displayPrice,
  displayUnitLabel,
  currencyCode = "AUD",
}: DailyFeatureCardProps) {
  return (
    <section className="featured-item-card">
      <ProductVisual
        name={product.name}
        category={product.category}
        subcategory={product.subcategory}
        imageUrl={product.imageUrl}
        size="hero"
      />
      <div className="featured-item-card__content">
        <div className="featured-item-card__eyebrow">{eyebrow}</div>
        <div className="featured-item-card__copy">
          <p className="featured-item-card__intro">
            A different product is highlighted each day.
          </p>
          <h3>{product.name}</h3>
          <p>{product.description}</p>
        </div>
        <div className="featured-item-card__details">
          <div className="featured-item-card__detail">
            <span className="muted">Today&apos;s price</span>
            <strong className="featured-item-card__price">
              {formatPriceWithUnit(
                displayPrice ?? product.basePrice,
                displayUnitLabel ?? product.unitLabel,
                currencyCode,
              )}
            </strong>
          </div>
          <div className="featured-item-card__detail">
            <span className="muted">Category</span>
            <span className="featured-item-card__category-text">
              {getProductCategoryLabel(product.category, product.subcategory)}
            </span>
          </div>
          <div className="featured-item-card__detail">
            <span className="muted">Rotation</span>
            <span className="featured-item-card__cycle">Changes daily</span>
          </div>
        </div>
        <a href={href} className="featured-item-card__cta">
          {ctaLabel}
        </a>
      </div>
    </section>
  );
}
