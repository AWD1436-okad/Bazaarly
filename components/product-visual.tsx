import type { ProductCategory } from "@prisma/client";
import Image from "next/image";

import { getCategoryIconSrc } from "@/lib/catalog";

type ProductVisualProps = {
  name: string;
  category?: ProductCategory | null;
  subcategory?: string | null;
  imageUrl?: string | null;
  size?: "compact" | "card" | "hero";
};

export function ProductVisual({
  name,
  category,
  imageUrl,
  size = "compact",
}: ProductVisualProps) {
  const className = ["product-visual", `product-visual--${size}`].join(" ");
  const categoryIconSrc = getCategoryIconSrc(category);

  return (
    <span className={className} aria-hidden="true">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes={size === "hero" ? "180px" : size === "card" ? "120px" : "56px"}
          className="product-visual__image product-visual__image--photo"
          unoptimized
        />
      ) : categoryIconSrc ? (
        <Image
          src={categoryIconSrc}
          alt=""
          fill
          sizes={size === "hero" ? "180px" : size === "card" ? "120px" : "56px"}
          className="product-visual__image product-visual__image--icon"
          title={name}
        />
      ) : (
        <span className="product-visual__fallback" title={name}>
          pp
        </span>
      )}
    </span>
  );
}
