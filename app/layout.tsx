import type { Metadata } from "next";

import "./globals.css";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

export const metadata: Metadata = {
  title: "Tradex",
  description: "A shared online marketplace simulation with player-owned shops and a living economy.",
  icons: {
    icon: [
      { url: "/tradex-final-icon.svg", type: "image/svg+xml" },
      { url: "/tradex-final-logo.png", sizes: "192x192", type: "image/png" },
      { url: "/tradex-logo4-favicon.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/tradex-final-icon.svg",
    apple: "/tradex-final-logo.png",
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
