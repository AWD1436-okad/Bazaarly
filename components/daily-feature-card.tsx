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
  eyebrow = "NEW",
}: DailyFeatureCardProps) {
  return (
    <section className="featured-item-card">
      <div className="featured-item-card__content">
        <div className="featured-item-card__eyebrow">{eyebrow}</div>
        <div>
          <h3>{product.name}</h3>
          <strong className="featured-item-card__price">
            {formatPriceWithUnit(product.basePrice, product.unitLabel)}
          </strong>
        </div>
        <a href={href} className="featured-item-card__cta">
          {ctaLabel}
        </a>
        <div className="featured-item-card__pager" aria-hidden="true">
          <span className="featured-item-card__dot featured-item-card__dot--active" />
          <span className="featured-item-card__dot" />
          <span className="featured-item-card__dot" />
          <span className="featured-item-card__dot" />
        </div>
        <span className="featured-item-card__category">
          {getCategoryLabel(product.category)}
        </span>
      </div>
      <div className="featured-item-card__visual" aria-hidden="true">
        <span className="featured-item-card__sun" />
        <span className="featured-item-card__produce featured-item-card__produce--large" />
        <span className="featured-item-card__produce featured-item-card__produce--small" />
        <span className="featured-item-card__counter" />
      </div>
    </section>
  );
}
