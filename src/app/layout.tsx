import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { DemoSiteBanner } from "@/components/demo-site-banner";
import { ThemeInit } from "@/components/theme-init";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
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
      // Default dark matches THEME_BOOT_SCRIPT / product default — avoids light→dark splash flash.
      className={cn("dark font-sans", geist.variable, geistMono.variable)}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeInit />
        <div id="lido-app">
          {isDemoSite ? <DemoSiteBanner /> : null}
          {children}
        </div>
      </body>
    </html>
  );
}
