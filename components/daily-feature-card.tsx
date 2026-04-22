import { type CatalogProduct, getCategoryLabel } from "@/lib/catalog";
import { formatPriceWithUnit } from "@/lib/money";

type DailyFeatureCardProps = {
  product: CatalogProduct;
  href: string;
  ctaLabel: string;
  eyebrow?: string;
};

export function DailyFeatureCard({
  product,
  href,
  ctaLabel,
  eyebrow = "Today's featured item",
}: DailyFeatureCardProps) {
  return (
    <section className="featured-item-card">
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
              {formatPriceWithUnit(product.basePrice, product.unitLabel)}
            </strong>
          </div>
          <div className="featured-item-card__detail">
            <span className="muted">Category</span>
            <span className="featured-item-card__category-text">
              {getCategoryLabel(product.category)}
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
