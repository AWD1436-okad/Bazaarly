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
        className={["brand-mark brand-mark--final", className].filter(Boolean).join(" ")}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 64 64" role="img" focusable="false" className="brand-mark__svg">
          <path className="brand-mark__arrow brand-mark__arrow--top" d="M13 16h12l6 13h12v-8l12 11-12 11v-8H27L18 24h-5z" />
          <path className="brand-mark__arrow brand-mark__arrow--bottom" d="M49 36v8H27l-9 10 8 7 6-7h23V36z" />
          <path className="brand-mark__spark" d="M26 32c5-2 7-4 9-10 2 6 4 8 10 10-6 2-8 4-10 10-2-6-4-8-9-10z" />
          <circle cx="21" cy="55" r="5" />
          <circle cx="47" cy="55" r="5" />
        </svg>
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
        src="/tradex-logo4-icon.png"
        alt=""
        fill
        sizes={`${size}px`}
        className="brand-mark__image"
        priority={size >= 48}
      />
    </span>
  );
}
