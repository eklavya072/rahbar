import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AfterCrash — what your family is owed after a road accident",
    short_name: "AfterCrash",
    description: "Finds every compensation and insurance claim after a road crash in India and prepares the paperwork. Works offline.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f4ee",
    theme_color: "#0f5c4d",
    lang: "en-IN",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
