import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Devanagari, Fraunces } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/lib/i18n";
import { RegisterSW } from "@/components/RegisterSW";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const deva = Noto_Sans_Devanagari({ variable: "--font-deva", subsets: ["devanagari"], weight: ["400", "500", "600", "700"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: "Rahbar (रहबर) — the way forward after a road accident",
  description:
    "An AI agent that reads a family's own papers, finds every compensation and insurance claim they are owed after a road accident in India, and prepares the paperwork — with a human approving every step.",
};

export const viewport: Viewport = { themeColor: "#f7f4ee", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${deva.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <LangProvider>{children}</LangProvider>
        <RegisterSW />
      </body>
    </html>
  );
}
