import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Profit Planet",
    short_name: "Profit Planet",
    description:
      "A kid-friendly business trading game where players buy stock, sell items, complete challenges, and grow their profit.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#06111f",
    theme_color: "#0d2f23",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/profit-planet-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/profit-planet-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
