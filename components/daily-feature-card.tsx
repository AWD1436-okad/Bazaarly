import { type CatalogProduct, getCategoryLabel } from "@/lib/catalog";
import { formatPriceWithUnit } from "@/lib/money";
import { ProductVisual } from "@/components/product-visual";

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
      <div className="featured-item-card__visual">
        <ProductVisual
          name={product.name}
          category={product.category}
          tone="featured"
        />
      </div>
      <div className="featured-item-card__content">
        <div className="featured-item-card__eyebrow">{eyebrow}</div>
        <div>
          <h3>{product.name}</h3>
          <p>{product.description}</p>
          <strong className="featured-item-card__price">
            {formatPriceWithUnit(product.basePrice, product.unitLabel)}
          </strong>
        </div>
        <a href={href} className="featured-item-card__cta">
          {ctaLabel}
        </a>
        <div className="featured-item-card__meta">
          <span className="featured-item-card__category">
            {getCategoryLabel(product.category)}
          </span>
          <span className="featured-item-card__cycle">Changes daily</span>
        </div>
      </div>
    </section>
  );
}
