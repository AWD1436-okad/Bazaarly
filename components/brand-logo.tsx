import Image from "next/image";

type BrandLogoProps = {
  size?: number;
  className?: string;
  variant?: "icon" | "final-icon";
};

export function BrandLogo({ size = 54, className, variant = "final-icon" }: BrandLogoProps) {
  if (variant === "final-icon") {
    return (
      <span
        className={["brand-mark brand-mark--planet", className].filter(Boolean).join(" ")}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <Image
          src="/profit-planet-icon.png"
          alt=""
          fill
          sizes={`${size}px`}
          className="brand-mark__image brand-mark__image--contain"
          priority={size >= 48}
        />
      </span>
    );
  }

  return (
    <span
      className={["brand-mark", className].filter(Boolean).join(" ")}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className="brand-mark__glow" />
      <Image
        src="/profit-planet-icon.png"
        alt=""
        fill
        sizes={`${size}px`}
        className="brand-mark__image brand-mark__image--contain"
        priority={size >= 48}
      />
    </span>
  );
}
