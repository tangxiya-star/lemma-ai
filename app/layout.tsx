import "./globals.css";
import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Lemma — Adaptive listings for every guest",
  description: "Persona-aware video generation for short-term rental hosts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
