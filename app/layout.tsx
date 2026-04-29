import type { Metadata } from "next";

import "./globals.css";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

export const metadata: Metadata = {
  title: "Tradex",
  description: "A shared online marketplace simulation with player-owned shops and a living economy.",
  icons: {
    icon: "/tradex-logo4-icon.png",
    shortcut: "/tradex-logo4-icon.png",
    apple: "/tradex-logo4-icon.png",
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
