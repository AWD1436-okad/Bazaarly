import Image from "next/image";

type BrandLogoProps = {
  size?: number;
  className?: string;
};

export function BrandLogo({ size = 46, className }: BrandLogoProps) {
  return (
    <span
      className={["brand-mark", className].filter(Boolean).join(" ")}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Image
        src="/bazaarly-logo.png"
        alt=""
        width={Math.round(size * 0.72)}
        height={Math.round(size * 0.72)}
        className="brand-mark__image"
      />
    </span>
  );
}
