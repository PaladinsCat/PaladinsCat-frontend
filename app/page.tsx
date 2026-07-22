"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
import ScrambleText from "@/components/ScrambleText";
import { useLocalization } from "@/lib/localization-context";

const MotionLink = motion.create(Link);

export default function HomePage() {
  const { t } = useLocalization();
  const reduceMotion = useReducedMotion();
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
        <motion.div
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1, delayChildren: 0.06 } },
          }}
          className="mb-12 text-center"
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: -12, scale: 0.86 },
              visible: { opacity: 1, y: 0, scale: 1 },
            }}
            transition={{ type: "spring", stiffness: 210, damping: 18 }}
            className="relative mx-auto mb-2 w-fit"
          >
            {!reduceMotion && (
              <motion.span
                aria-hidden="true"
                className="absolute inset-2 -z-10 rounded-full bg-pc-accent/20 blur-xl"
                animate={{ opacity: [0.28, 0.55, 0.28], scale: [0.88, 1.12, 0.88] }}
                transition={{ duration: 3.8, ease: "easeInOut", repeat: Infinity }}
              />
            )}
            <Image
              src="/images/icons/paladinscat.avif"
              alt={t("home.logoAlt")}
              width={80}
              height={80}
              unoptimized
              priority
              className="opacity-90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]"
            />
          </motion.div>
          <motion.h1
            variants={{
              hidden: { opacity: 0, y: 8 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.42, ease: "easeOut" }}
            className="relative inline-block text-4xl font-semibold tracking-wide drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]"
          >
            <ScrambleText
              text={t("home.brandLead")}
              speed={30}
              iterations={15}
              delayFromCenter={false}
              className="text-pc-text"
            />
            <ScrambleText
              text={t("home.brandAccent")}
              speed={30}
              iterations={15}
              delayFromCenter={false}
              className="text-pc-accent"
            />
            <AnimatePresence mode="wait" initial={false}>
              {siteVersion?.version ? (
                <MotionLink
                  key="version"
                  href="/changelog"
                  aria-label={t("menu.changelog")}
                  title={t("menu.changelog")}
                  initial={reduceMotion ? false : { opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={reduceMotion ? undefined : { y: -1, scale: 1.04 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                  className="absolute left-full top-0 ml-1.5 whitespace-nowrap rounded-sm font-mono text-sm font-medium leading-none tracking-normal text-pc-text-muted drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] transition-colors hover:text-pc-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent"
                >
                  {siteVersion.version}
                </MotionLink>
              ) : (
                <motion.span
                  key="version-loading"
                  aria-hidden="true"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="pc-skeleton absolute left-full top-0 ml-1.5 h-3 w-10 rounded-full"
                />
              )}
            </AnimatePresence>
          </motion.h1>
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 7 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.38, ease: "easeOut" }}
            className="mt-1 text-sm text-pc-text-secondary drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
          >
            {t("home.tagline")}
          </motion.p>
        </motion.div>

        <HomeSearch />
      </section>

      <section className="mx-auto max-w-4xl px-1 py-14 sm:px-4 sm:py-20">
        <motion.h2
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center text-3xl font-bold tracking-tight text-pc-text sm:text-4xl"
        >
          <span className="block">{t("home.exploreTitleLead")}</span>
          <span className="mt-1 block">{t("home.exploreTitleRest")}</span>
        </motion.h2>

        <motion.div
          initial={reduceMotion ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.11 } },
          }}
          className="mt-8 grid gap-4 md:grid-cols-3"
        >
          {exploreCards.map(({ href, icon: Icon, eyebrow, title }, index) => (
            <MotionLink
              key={href}
              href={href}
              variants={{
                hidden: { opacity: 0, y: 22, scale: 0.97 },
                visible: { opacity: 1, y: 0, scale: 1 },
              }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={reduceMotion ? undefined : { y: -6, scale: 1.012 }}
              whileTap={reduceMotion ? undefined : { scale: 0.985 }}
              className="pc-glass group relative flex min-h-44 flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/5 p-6 text-center shadow-lg transition-colors duration-300 hover:border-pc-accent-mid hover:shadow-[0_18px_45px_rgba(0,0,0,0.28)]"
            >
              <span
                aria-hidden="true"
                className={`absolute -left-20 -top-24 h-52 w-52 rounded-full blur-3xl transition-all duration-500 group-hover:translate-x-10 group-hover:translate-y-8 group-hover:opacity-100 ${index === 2 ? "bg-[#786cf2]/15 opacity-40" : "bg-pc-accent/15 opacity-35"}`}
              />
              <ArrowRight className="absolute right-5 top-5 h-4 w-4 text-pc-text-muted transition-all duration-300 group-hover:translate-x-1 group-hover:text-pc-accent" aria-hidden="true" />
              <motion.span
                whileHover={reduceMotion ? undefined : { rotate: -4, scale: 1.08 }}
                transition={{ type: "spring", stiffness: 300, damping: 16 }}
                className={`relative flex h-11 w-11 items-center justify-center rounded-xl border transition-shadow duration-300 group-hover:shadow-[0_0_24px_rgba(51,182,177,0.18)] ${index === 2 ? "border-[#786cf2]/25 bg-[#786cf2]/10 text-[#aaa3ff]" : "border-pc-accent/20 bg-pc-accent/10 text-pc-accent"}`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </motion.span>
              <p className="relative mt-4 text-xs font-bold uppercase tracking-[0.16em] text-pc-text-muted transition-colors duration-300 group-hover:text-pc-text-secondary">{eyebrow}</p>
              <h3 className="relative mt-2 text-xl font-bold text-pc-text">{title}</h3>
              <span className="absolute inset-x-8 bottom-0 h-px origin-center scale-x-0 bg-gradient-to-r from-transparent via-pc-accent to-transparent transition-transform duration-500 group-hover:scale-x-100" aria-hidden="true" />
            </MotionLink>
          ))}
        </motion.div>
      </section>

    </div>
  );
}
