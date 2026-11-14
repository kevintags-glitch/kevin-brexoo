import type { MetadataRoute } from "next";

/** Lets people add Brexoo to their phone or tablet home screen and open the workspace like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Brexoo",
    short_name: "Brexoo",
    description: "Find, qualify and win local projects.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0F2742",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
