/**
 * Define the layout responsibility boundary.
 * Coordinates layout data loading, authorization, and presentation.
 */
import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/nav";
import HirezOutageBanner from "@/components/HirezOutageBanner";
import Footer from "@/components/footer";
import BottomNav from "@/components/bottom-nav";
import MapSlideshow from "@/components/MapSlideshow";
import PageLayout from "@/components/PageLayout";
import { AuthProvider } from "@/lib/auth-context";
import { TimeZoneProvider } from "@/lib/time-zone-context";
import { LocalizationProvider } from "@/lib/localization-context";
import { LobbyTierProvider } from "@/lib/lobby-tier-context";
import LobbyTierBanner from "@/components/LobbyTierBanner";
import SiteAnalytics from "@/components/SiteAnalytics";
import DeploymentUpdateBanner from "@/components/DeploymentUpdateBanner";
import SiteBanner from "@/components/SiteBanner";
import ImageAssetFallback from "@/components/ImageAssetFallback";
import CoreUiDragGuard from "@/components/CoreUiDragGuard";
import LiteModeProvider from "@/components/LiteModeProvider";
import { cn } from "@/lib/utils";
import { headers } from "next/headers";
import { SEO_KEYWORDS, SITE_NAME, SITE_URL, serializeJsonLd } from "@/lib/seo";
import { getServerLocalization } from "@/lib/server-localization";

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns the declared route value; request, cache, and navigation effects follow the implementation.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerLocalization();
  const title = t("seo.root.title");
  return {
    metadataBase: new URL(SITE_URL),
    applicationName: SITE_NAME,
    title: { default: title, template: `%s | ${SITE_NAME}` },
    description: t("seo.root.description"),
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    other: { "google-adsense-account": "ca-pub-5642439289050032" },
    icons: {
      icon: [{ url: "/images/icons/paladinscat.png", type: "image/png", sizes: "120x120" }],
      shortcut: "/images/icons/paladinscat.png",
      apple: "/images/icons/paladinscat.png",
    },
    openGraph: {
      type: "website",
      url: SITE_URL,
      siteName: SITE_NAME,
      title,
      description: t("seo.root.openGraphDescription"),
      images: [{ url: "/images/icons/paladinscat.avif", width: 120, height: 120, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary",
      title,
      description: t("seo.root.twitterDescription"),
      images: ["/images/icons/paladinscat.avif"],
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
  };
}

/** Render the site shell with localized metadata, nonce-aware security data, and shared providers. */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, messages, t } = await getServerLocalization();
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        description: t("seo.root.structuredDescription"),
        inLanguage: locale,
        publisher: { "@id": `${SITE_URL}/#organization` },
        about: { "@id": `${SITE_URL}/#paladins-game` },
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/images/icons/paladinscat.png`,
          width: 120,
          height: 120,
        },
      },
      {
        "@type": "VideoGame",
        "@id": `${SITE_URL}/#paladins-game`,
        name: "Paladins: Champions of the Realm",
        alternateName: "Paladins",
        url: "https://www.paladins.com/",
        sameAs: "https://www.paladins.com/",
        genre: ["Hero shooter", "First-person shooter"],
      },
      {
        "@type": "Dataset",
        "@id": `${SITE_URL}/#dataset`,
        name: t("seo.root.datasetName"),
        url: SITE_URL,
        description: t("seo.root.datasetDescription"),
        keywords: SEO_KEYWORDS.join(", "),
        inLanguage: locale,
        isAccessibleForFree: true,
        about: { "@id": `${SITE_URL}/#paladins-game` },
        creator: {
          "@id": `${SITE_URL}/#organization`,
        },
        license: `${SITE_URL}/terms`,
      },
    ],
  };

  return (
    <html lang={locale} className={cn("dark", "font-sans")}>
      <head></head>
      <body className="min-h-screen bg-pc-bg text-pc-text flex flex-col">
        <CoreUiDragGuard />
        <ImageAssetFallback />
        {/* suppressHydrationWarning: the per-request CSP nonce is injected into
            the server-rendered script but absent from the client hydration tree
            (browsers strip it after execution) — a known Next.js dev-mode
            mismatch (vercel/next.js#77952). Only the nonce attr differs. */}
        <script
                  nonce={nonce}
                  suppressHydrationWarning
                  type="application/ld+json"
                  dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
                />
        <AuthProvider>
          <LocalizationProvider initialLocale={locale} initialMessages={messages}>
            <TimeZoneProvider>
              <LobbyTierProvider>
              <LiteModeProvider>
              <SiteAnalytics />
              <MapSlideshow />
              <Nav />
              <DeploymentUpdateBanner />
              <SiteBanner />
              <LobbyTierBanner />
              <HirezOutageBanner />
              {/* Content container: responsive width that fills common desktop sizes */}
              <main className="min-h-[calc(100svh-4rem)] flex-1 w-full min-w-0 mx-auto px-3 py-5 pb-28 sm:px-6 sm:py-8 lg:px-8 xl:px-12 2xl:px-16">
                {/* Responsive max-width: 1280px up to xl, wider on larger screens */}
                <div className="mx-auto min-w-0 max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px]">
                  <PageLayout>{children}</PageLayout>
                </div>
              </main>
              <div className="block lg:hidden"><BottomNav /></div>
              <Footer />
              </LiteModeProvider>
              </LobbyTierProvider>
            </TimeZoneProvider>
          </LocalizationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
