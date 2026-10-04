import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Noto_Sans_Devanagari, Tiro_Devanagari_Hindi } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/lib/i18n";
import { RegisterSW } from "@/components/RegisterSW";

/* The faces, self-hosted (the same family as Meridian):
   Newsreader — the serif voice of headings, warm and humane, ink on paper.
   Public Sans — body text, designed for government services; reads well at small sizes.
   Schibsted Grotesk — the voice that sits on the hero film.
   IBM Plex Mono — numbers, amounts, deadlines and the agent trace.
   Unbounded — the Rahbar wordmark only.
   Devanagari: Tiro Devanagari Hindi pairs with Newsreader; Noto Sans Devanagari with Public Sans. */
const serif = localFont({
  src: [
    { path: "./fonts/newsreader-normal.woff2", weight: "200 800", style: "normal" },
    { path: "./fonts/newsreader-italic.woff2", weight: "200 800", style: "italic" },
  ],
  variable: "--font-serif",
  display: "swap",
});
const sans = localFont({ src: "./fonts/public-sans.woff2", weight: "100 900", variable: "--font-sans-face", display: "swap" });
const grotesk = localFont({ src: "./fonts/schibsted-grotesk.woff2", weight: "400 900", variable: "--font-grotesk-face", display: "swap" });
const mono = localFont({
  src: [
    { path: "./fonts/ibm-plex-mono-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ibm-plex-mono-500-normal.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-mono-face",
  display: "swap",
});
const brand = localFont({ src: "./fonts/unbounded.woff2", weight: "200 900", variable: "--font-brand-face", display: "swap" });
const devaSans = Noto_Sans_Devanagari({ variable: "--font-deva", subsets: ["devanagari"], weight: ["400", "500", "600", "700"] });
const devaSerif = Tiro_Devanagari_Hindi({ variable: "--font-deva-serif", subsets: ["devanagari"], weight: "400" });

export const metadata: Metadata = {
  title: "Rahbar (रहबर) — the way forward after a road accident",
  description:
    "After a road accident in India, Rahbar reads a family's own papers on their phone, finds every rupee they are owed, prepares the letters and follows up — with the family approving every step.",
};

export const viewport: Viewport = { themeColor: "#0A0C10", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable} ${grotesk.variable} ${mono.variable} ${brand.variable} ${devaSans.variable} ${devaSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <LangProvider>{children}</LangProvider>
        <RegisterSW />
      </body>
    </html>
  );
}
