import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/nav";
// Footer component — added in Phase 2, displays on every page
import Footer from "@/components/footer";
// Bottom island dock navigation
import BottomNav from "@/components/bottom-nav";
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
      {/* flex flex-col min-h-screen ensures footer sticks to bottom even on short pages */}
      <body className="min-h-screen bg-pc-bg text-pc-text flex flex-col">
        <Nav />
        {/* Removed fixed max-w from main; each page controls its own container width */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">{children}</main>
        {/* Bottom nav: visible on mobile only, hidden on desktop (md and up) */}
        <div className="block md:hidden"><BottomNav /></div>
        <Footer />
      </body>
    </html>
  );
}
