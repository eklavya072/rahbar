import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rahbar (रहबर): the way forward after a road accident",
    short_name: "Rahbar",
    description: "Finds every compensation and insurance claim after a road accident in India and prepares the paperwork. Works offline.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f4ee",
    theme_color: "#0f5c4d",
    lang: "en-IN",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
