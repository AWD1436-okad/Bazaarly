import Image from "next/image";

type BrandLogoProps = {
  size?: number;
  className?: string;
};

export function BrandLogo({ size = 54, className }: BrandLogoProps) {
  return (
    <span
      className={["brand-mark", className].filter(Boolean).join(" ")}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className="brand-mark__glow" />
      <Image
        src="/tradex-logo4-icon-square.png"
        alt=""
        fill
        sizes={`${size}px`}
        className="brand-mark__image"
      />
    </span>
  );
}
