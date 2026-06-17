import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import BottomNav from "@/components/bottom-nav";
import MapSlideshow from "@/components/MapSlideshow";
import PageLayout from "@/components/PageLayout";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin','latin-ext'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "PaladinsCat — Stats & Meta Analysis",
  description: "Paladins stats, champion analysis, and meta tracking platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("dark", "font-sans", geist.variable)}>
      <body className="min-h-screen bg-pc-bg text-pc-text flex flex-col">
        <MapSlideshow />
        <Nav />
        {/* Content container: responsive width that fills common desktop sizes */}
        <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8 pb-24">
          {/* Responsive max-width: 1280px up to xl, wider on larger screens */}
          <div className="max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto">
            <PageLayout>{children}</PageLayout>
          </div>
        </main>
        <div className="block md:hidden"><BottomNav /></div>
        <Footer />
      </body>
    </html>
  );
}
