import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import "./globals.css";
import Toast from "@/components/Toast";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Strangers & Co | Mysore — Taranga",
  description:
    "Meet. Mingle. Make Friends. Join Mysore's most exciting social meetup at Avinya Cafe on September 20, 2026. 2PM to 5PM. Early bird passes available.",
  keywords: ["Strangers & Co", "Taranga", "Mysore events", "Avinya Cafe", "meetup", "social mixer", "games"],
  openGraph: {
    title: "Strangers & Co | Mysore — Taranga",
    description: "Meet new people, play fun games, make real friends. Sep 20 at Avinya Cafe, Mysore.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAF7F2] text-[#1C1917] font-[family-name:var(--font-sans)]">
        {children}
        <Toast />
      </body>
    </html>
  );
}
