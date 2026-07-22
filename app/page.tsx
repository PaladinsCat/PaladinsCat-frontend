"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Bot,
  UsersRound,
} from "lucide-react";
import {
  fetchSiteVersion,
  type SiteVersion,
} from "@/lib/api-client";
import HomeSearch from "@/components/home-search";
import { useLocalization } from "@/lib/localization-context";

export default function HomePage() {
  const { t } = useLocalization();
  const [siteVersion, setSiteVersion] = useState<SiteVersion | null>(null);

  useEffect(() => {
    const load = async () => {
      const version = await fetchSiteVersion();
      setSiteVersion(version);
    };
    load();
  }, []);

  const exploreCards = [
    {
      href: "/players",
      icon: UsersRound,
      eyebrow: t("home.explorePlayersEyebrow"),
      title: t("home.explorePlayersTitle"),
    },
    {
      href: "/champions",
      icon: BarChart3,
      eyebrow: t("home.exploreMetaEyebrow"),
      title: t("home.exploreMetaTitle"),
    },
    {
      href: "/operations/paladinscat-bot",
      icon: Bot,
      eyebrow: t("home.exploreBotEyebrow"),
      title: t("home.exploreBotTitle"),
    },
  ];

  return (
    <div className="relative z-10 mx-auto max-w-6xl pb-8">
      <section className="py-8 sm:py-12">
        <motion.div initial={false} className="mb-12 text-center">
          <Image
            src="/images/icons/paladinscat.avif"
            alt={t("home.logoAlt")}
            width={80}
            height={80}
            unoptimized
            priority
            className="mx-auto mb-2 opacity-90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]"
          />
          <h1 className="relative inline-block text-4xl font-semibold tracking-wide drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
            <span className="text-pc-text">{t("home.brandLead")}</span>
            <span className="text-pc-accent">{t("home.brandAccent")}</span>
            {siteVersion?.version && (
              <Link
                href="/changelog"
                aria-label={t("menu.changelog")}
                title={t("menu.changelog")}
                className="absolute left-full top-0 ml-1.5 whitespace-nowrap rounded-sm font-mono text-sm font-medium leading-none tracking-normal text-pc-text-muted drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] transition-colors hover:text-pc-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent"
              >
                {siteVersion.version}
              </Link>
            )}
          </h1>
          <p className="mt-1 text-sm text-pc-text-secondary drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            {t("home.tagline")}
          </p>
        </motion.div>

        <HomeSearch />
      </section>

      <section className="mx-auto max-w-4xl px-1 py-14 sm:px-4 sm:py-20">
        <h2 className="mx-auto max-w-2xl text-center text-3xl font-bold tracking-tight text-pc-text sm:text-4xl">
          <span className="block">{t("home.exploreTitleLead")}</span>
          <span className="mt-1 block">{t("home.exploreTitleRest")}</span>
        </h2>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {exploreCards.map(({ href, icon: Icon, eyebrow, title }, index) => (
            <Link
              key={href}
              href={href}
              className="pc-glass group relative flex min-h-44 flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/5 p-6 text-center transition hover:-translate-y-0.5 hover:border-pc-accent-mid"
            >
              <ArrowRight className="absolute right-5 top-5 h-4 w-4 text-pc-text-muted transition group-hover:translate-x-0.5 group-hover:text-pc-accent" aria-hidden="true" />
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl border ${index === 2 ? "border-[#786cf2]/25 bg-[#786cf2]/10 text-[#aaa3ff]" : "border-pc-accent/20 bg-pc-accent/10 text-pc-accent"}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-pc-text-muted">{eyebrow}</p>
              <h3 className="mt-2 text-xl font-bold text-pc-text">{title}</h3>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
