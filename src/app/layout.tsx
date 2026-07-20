import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";

import { DemoSiteBanner } from "@/components/demo-site-banner";
import { ThemeInit } from "@/components/theme-init";
import { ToastProvider } from "@/components/toast";
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/seo";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
import { cn } from "@/lib/utils";

import "./globals.css";

/** Public marketing site (lido.wtf) — not Umbrel / self-hosted builds. */
const isPublicSite =
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

/** Umbrel / Docker: short app tab title only — no marketing SEO. */
const appMetadata: Metadata = {
  title: SITE_NAME,
  description: "Solo Bitcoin mining pool dashboard.",
  applicationName: SITE_NAME,
  robots: { index: false, follow: false },
};

/** lido.wtf: discovery metadata, OG, sitemap targets. */
const publicMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: SITE_KEYWORDS,
  authors: [{ name: "Kevin Guest", url: "https://github.com/KevinGuest" }],
  creator: "Kevin Guest",
  publisher: SITE_NAME,
  category: "technology",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  other: {
    "theme-color": "#0a0a0a",
  },
};

export const metadata: Metadata = isPublicSite ? publicMetadata : appMetadata;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  alternateName: SITE_TAGLINE,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: "FinanceApplication",
  operatingSystem: "Linux",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Person",
    name: "Kevin Guest",
    url: "https://github.com/KevinGuest",
  },
  codeRepository: "https://github.com/KevinGuest/lido",
  downloadUrl: "https://github.com/KevinGuest/lido-app",
  softwareVersion: process.env.NEXT_PUBLIC_LIDO_VERSION,
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
      <body className="min-h-screen bg-background text-foreground antialiased">
        {isPublicSite ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        ) : null}
        <Script
          id="lido-theme-boot"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }}
        />
        <ThemeInit />
        <ToastProvider offsetTopClassName={isPublicSite ? "top-14" : "top-4"}>
          <div id="lido-app">
            {isPublicSite ? <DemoSiteBanner /> : null}
            {children}
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
