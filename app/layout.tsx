import type { Metadata } from "next";

import "./globals.css";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

export const metadata: Metadata = {
  title: "Bazaarly",
  description: "A shared online marketplace simulation with player-owned shops and a living economy.",
  icons: {
    icon: "/bazaarly-logo.png",
    shortcut: "/bazaarly-logo.png",
    apple: "/bazaarly-logo.png",
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
