import type { ProductCategory } from "@prisma/client";
import Image from "next/image";
import { PackageOpen } from "lucide-react";

import { getCategoryIconSrc } from "@/lib/catalog";

type CategoryIconProps = {
  category?: ProductCategory | null;
  label?: string;
  size?: "sm" | "md" | "lg";
};

export function CategoryIcon({ category, label, size = "md" }: CategoryIconProps) {
  const iconSrc = getCategoryIconSrc(category);

  return (
    <span
      className={["category-svg-icon", `category-svg-icon--${size}`].join(" ")}
      aria-hidden="true"
      title={label}
    >
      {iconSrc ? (
        <Image
          src={iconSrc}
          alt=""
          fill
          sizes={size === "lg" ? "116px" : size === "md" ? "68px" : "28px"}
          className="category-svg-icon__image"
        />
      ) : (
        <PackageOpen className="category-svg-icon__main" strokeWidth={2.25} />
      )}
    </span>
  );
}
