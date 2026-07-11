import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/nav";
import HirezOutageBanner from "@/components/HirezOutageBanner";
import Footer from "@/components/footer";
import BottomNav from "@/components/bottom-nav";
import MapSlideshow from "@/components/MapSlideshow";
import PageLayout from "@/components/PageLayout";
import { AuthProvider } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { SEO_KEYWORDS, SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: "Paladins Stats, Ranked Data & Champion Meta",
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "PaladinsCat tracks Paladins stats, ranked match data, champion win rates, ELO leaderboards, player profiles, and live meta trends.",
  keywords: SEO_KEYWORDS,
  authors: [{ name: "PaladinsCat" }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      {
        url: "/images/icons/paladinscat.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    shortcut: "/images/icons/paladinscat.png",
    apple: "/images/icons/paladinscat.png",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Paladins Stats, Ranked Data & Champion Meta",
    description:
      "Search Paladins player profiles, ranked leaderboards, champion stats, match history, win rates, and meta data.",
    images: [
      {
        url: "/images/icons/paladinscat.avif",
        width: 512,
        height: 512,
        alt: "PaladinsCat",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Paladins Stats, Ranked Data & Champion Meta",
    description:
      "Paladins stats, champion data, ranked leaderboards, match history, and meta analytics.",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        description:
          "Paladins stats, ranked data, champion analytics, match history, and player leaderboards.",
        inLanguage: "en-US",
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/images/icons/paladinscat.avif`,
      },
      {
        "@type": "Dataset",
        "@id": `${SITE_URL}/#dataset`,
        name: "Paladins Ranked Match Stats and Champion Data",
        url: SITE_URL,
        description:
          "Ranked Paladins match data, champion performance metrics, player ratings, win rates, ban rates, item stats, and tier distributions.",
        keywords: SEO_KEYWORDS.join(", "),
        creator: {
          "@id": `${SITE_URL}/#organization`,
        },
        license: `${SITE_URL}/terms`,
      },
    ],
  };

  return (
    <html lang="en" className={cn("dark", "font-sans")}>
      <head></head>
      <body className="min-h-screen bg-pc-bg text-pc-text flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <AuthProvider>
          <MapSlideshow />
          <Nav />
          <HirezOutageBanner />
          {/* Content container: responsive width that fills common desktop sizes */}
          <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8 pb-24">
            {/* Responsive max-width: 1280px up to xl, wider on larger screens */}
            <div className="max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto">
              <PageLayout>{children}</PageLayout>
            </div>
          </main>
          <div className="block lg:hidden"><BottomNav /></div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
