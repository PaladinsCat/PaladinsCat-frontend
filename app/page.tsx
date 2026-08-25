import type { Metadata } from "next";
import HomePageClient from "./home-page-client";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <HomePageClient />;
}
