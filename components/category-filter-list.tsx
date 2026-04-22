import type { CategoryOption } from "@/lib/catalog";

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
              <span className="category-filter-link__emoji" aria-hidden="true">
                {category.emoji}
              </span>
              <span>{category.label}</span>
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
        <span>{allLabel}</span>
      </a>
    </nav>
  );
}
