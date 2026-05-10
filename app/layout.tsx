import type { Metadata, Viewport } from "next";

import { PwaRegister } from "@/components/pwa-register";

import "./globals.css";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

export const metadata: Metadata = {
  metadataBase: new URL("https://profitplanet.win"),
  title: "Profit Planet",
  description: "A business trading game where you buy, sell, restock, and grow your profit planet.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Profit Planet",
    statusBarStyle: "black-translucent",
  },
  applicationName: "Profit Planet",
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
      { url: "/profit-planet-icon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/profit-planet-icon.png",
    apple: "/profit-planet-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d2f23",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
