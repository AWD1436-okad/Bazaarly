import { CategoryIcon } from "@/components/category-icon";
import { getCategoryOptionDisplayLabel, type CategoryOption } from "@/lib/catalog";

type CategoryFilterListProps = {
  categories: readonly CategoryOption[];
  selectedCategory: string | null;
  buildHref: (category: string | null) => string;
  allLabel?: string;
};

export function CategoryFilterList({
  categories,
  selectedCategory,
  buildHref,
  allLabel = "All categories",
}: CategoryFilterListProps) {
  return (
    <nav aria-label="Category filters" className="category-filter-nav">
      <div className="category-filter-list">
        {categories.map((category) => {
          const isActive = selectedCategory === category.value;
          const label = getCategoryOptionDisplayLabel(category);

          return (
            <a
              key={category.value}
              href={buildHref(category.value)}
              className={[
                "category-filter-link",
                isActive ? "category-filter-link--active" : null,
              ]
                .filter(Boolean)
                .join(" ")}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="category-filter-link__icon" aria-hidden="true">
                <CategoryIcon category={category.category ?? null} size="sm" />
              </span>
              <span>{label}</span>
            </a>
          );
        })}
      </div>
      <a
        href={buildHref(null)}
        className={[
          "category-filter-link",
          "category-filter-link--all",
          selectedCategory ? null : "category-filter-link--active",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-current={selectedCategory ? undefined : "page"}
      >
        <span
          className="category-filter-link__icon category-filter-link__icon--all"
          aria-hidden="true"
        >
          <CategoryIcon size="sm" />
        </span>
        <span>{allLabel}</span>
      </a>
    </nav>
  );
}
