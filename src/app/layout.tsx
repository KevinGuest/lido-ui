import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { DemoSiteBanner } from "@/components/demo-site-banner";
import { ThemeInit } from "@/components/theme-init";
import { cn } from "@/lib/utils";

import "./globals.css";

const isDemoSite =
  process.env.GITHUB_PAGES === "true" ||
  process.env.NEXT_PUBLIC_LIDO_DEMO === "true" ||
  process.env.LIDO_USE_MOCK === "true";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Lido",
  description: "Lido is a Fully Open Source Solo Bitcoin Mining Pool fork of Public Pool.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("dark font-sans", geist.variable, geistMono.variable)}
    >
      <body className="min-h-screen antialiased">
        <ThemeInit />
        {isDemoSite ? <DemoSiteBanner /> : null}
        {children}
      </body>
    </html>
  );
}
