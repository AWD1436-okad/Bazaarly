import type { Metadata } from "next";

import "./globals.css";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

export const metadata: Metadata = {
  metadataBase: new URL("https://profitplanet.win"),
  title: "Profit Planet",
  description: "A business trading game where you buy, sell, restock, and grow your profit planet.",
  openGraph: {
    title: "Profit Planet",
    description: "A business trading game where you buy, sell, restock, and grow your profit planet.",
    url: "https://profitplanet.win",
    siteName: "Profit Planet",
    images: [{ url: "/profit-planet-logo.png", width: 1254, height: 1254, alt: "Profit Planet" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Profit Planet",
    description: "A business trading game where you buy, sell, restock, and grow your profit planet.",
    images: ["/profit-planet-logo.png"],
  },
  icons: {
    icon: [
      { url: "/profit-planet-icon.png", sizes: "192x192", type: "image/png" },
      { url: "/profit-planet-logo.png", sizes: "1024x1024", type: "image/png" },
    ],
    shortcut: "/profit-planet-icon.png",
    apple: "/profit-planet-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
