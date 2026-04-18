import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Bazaarly",
  description: "A shared online marketplace simulation with player-owned shops and a living economy.",
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
