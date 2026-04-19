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
      <div className="featured-item-card__eyebrow">{eyebrow}</div>
      <div className="stack-sm">
        <div className="section-row">
          <span className="category-chip">{getCategoryLabel(product.category)}</span>
          <strong>{formatPriceWithUnit(product.basePrice, product.unitLabel)}</strong>
        </div>
        <div>
          <h3>{product.name}</h3>
          <p>{product.description}</p>
        </div>
        <a href={href} className="ghost-button">
          {ctaLabel}
        </a>
      </div>
    </section>
  );
}
