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
const WALLPAPER_BRAND_OUT_MS = 420;
const WALLPAPER_BRAND_IN_MS = 480;
const WALLPAPER_PHASE_FALLBACK_BUFFER_MS = 140;
const WALLPAPER_SCROLL_KEYS = new Set([" ", "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"]);
type WallpaperModePhase = "idle" | "fading" | "arriving" | "active" | "returning" | "settling";
type HomeScrollbarState = { top: number; height: number; visible: boolean };

function syncWallpaperModeDom(phase: WallpaperModePhase) {
  const root = document.documentElement;
  if (phase === "idle") {
    delete root.dataset.homeWallpaperMode;
    delete root.dataset.homeWallpaperPhase;
    return;
  }

  root.dataset.homeWallpaperPhase = phase;
  if (phase === "arriving" || phase === "active" || phase === "returning") root.dataset.homeWallpaperMode = "true";
  else delete root.dataset.homeWallpaperMode;
}

export default function HomePage() {
  const { t } = useLocalization();
  const reduceMotion = useReducedMotion();
  const [siteVersion, setSiteVersion] = useState<SiteVersion | null>(null);
  const [searchActive, setSearchActive] = useState(false);
  const [wallpaperModePhase, setWallpaperModePhase] = useState<WallpaperModePhase>("idle");
  const [homeScrollbar, setHomeScrollbar] = useState<HomeScrollbarState>({ top: 4, height: 0, visible: false });
  const wallpaperModeEnabled = wallpaperModePhase !== "idle";
  const wallpaperModeAtCorner = wallpaperModePhase === "arriving"
    || wallpaperModePhase === "active"
    || wallpaperModePhase === "returning";
  const exploreTitleLead = t("home.exploreTitleLead");
  const exploreTitleAccentStart = exploreTitleLead.lastIndexOf(" ") + 1;

  useEffect(() => {
    const load = async () => {
      const version = await fetchSiteVersion();
      setSiteVersion(version);
    };
    load();
  }, []);

  useEffect(() => {
    let animationFrame = 0;
    const syncHomeScrollbar = () => {
      animationFrame = 0;
      const viewportHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollRange = Math.max(0, documentHeight - viewportHeight);
      const trackHeight = Math.max(0, viewportHeight - 8);
      const thumbHeight = scrollRange > 0
        ? Math.max(40, Math.round(trackHeight * (viewportHeight / documentHeight)))
        : 0;
      const thumbRange = Math.max(0, trackHeight - thumbHeight);
      const top = 4 + (scrollRange > 0 ? Math.round((window.scrollY / scrollRange) * thumbRange) : 0);
      const next = { top, height: thumbHeight, visible: scrollRange > 1 };
      setHomeScrollbar((current) => (
        current.top === next.top && current.height === next.height && current.visible === next.visible
          ? current
          : next
      ));
    };
    const scheduleHomeScrollbarSync = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(syncHomeScrollbar);
    };
    const resizeObserver = new ResizeObserver(scheduleHomeScrollbarSync);

    scheduleHomeScrollbarSync();
    window.addEventListener("scroll", scheduleHomeScrollbarSync, { passive: true });
    window.addEventListener("resize", scheduleHomeScrollbarSync);
    resizeObserver.observe(document.body);
    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", scheduleHomeScrollbarSync);
      window.removeEventListener("resize", scheduleHomeScrollbarSync);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    syncWallpaperModeDom(wallpaperModePhase);

    const exitWallpaperMode = (event: KeyboardEvent) => {
      if (wallpaperModePhase !== "idle" && WALLPAPER_SCROLL_KEYS.has(event.key)) {
        event.preventDefault();
        return;
      }
      if (event.key !== "Escape") return;
      const nextPhase = wallpaperModePhase === "active"
        ? "returning"
        : wallpaperModePhase === "fading"
          ? "idle"
          : wallpaperModePhase;
      syncWallpaperModeDom(nextPhase);
      setWallpaperModePhase(nextPhase);
    };
    const preventWallpaperScroll = (event: Event) => event.preventDefault();
    let phaseTimer: number | null = null;
    if (wallpaperModePhase === "fading") {
      phaseTimer = window.setTimeout(
        () => {
          syncWallpaperModeDom("arriving");
          setWallpaperModePhase("arriving");
        },
        reduceMotion ? 0 : WALLPAPER_BRAND_OUT_MS + WALLPAPER_PHASE_FALLBACK_BUFFER_MS,
      );
    } else if (wallpaperModePhase === "arriving") {
      phaseTimer = window.setTimeout(
        () => {
          syncWallpaperModeDom("active");
          setWallpaperModePhase("active");
        },
        reduceMotion ? 0 : WALLPAPER_BRAND_IN_MS + WALLPAPER_PHASE_FALLBACK_BUFFER_MS,
      );
    } else if (wallpaperModePhase === "returning") {
      phaseTimer = window.setTimeout(
        () => {
          syncWallpaperModeDom("settling");
          setWallpaperModePhase("settling");
        },
        reduceMotion ? 0 : WALLPAPER_BRAND_OUT_MS + WALLPAPER_PHASE_FALLBACK_BUFFER_MS,
      );
    } else if (wallpaperModePhase === "settling") {
      phaseTimer = window.setTimeout(
        () => {
          syncWallpaperModeDom("idle");
          setWallpaperModePhase("idle");
        },
        reduceMotion ? 0 : WALLPAPER_BRAND_IN_MS + WALLPAPER_PHASE_FALLBACK_BUFFER_MS,
      );
    }
    window.addEventListener("keydown", exitWallpaperMode);
    if (wallpaperModePhase !== "idle") {
      window.addEventListener("wheel", preventWallpaperScroll, { passive: false });
      window.addEventListener("touchmove", preventWallpaperScroll, { passive: false });
    }
    return () => {
      if (phaseTimer !== null) window.clearTimeout(phaseTimer);
      window.removeEventListener("keydown", exitWallpaperMode);
      window.removeEventListener("wheel", preventWallpaperScroll);
      window.removeEventListener("touchmove", preventWallpaperScroll);
    };
  }, [reduceMotion, wallpaperModePhase]);

  useEffect(() => () => syncWallpaperModeDom("idle"), []);

  const toggleWallpaperMode = () => {
    const nextPhase = wallpaperModePhase === "idle"
      ? "fading"
      : wallpaperModePhase === "fading"
        ? "idle"
        : wallpaperModePhase === "active"
          ? "returning"
          : wallpaperModePhase;
    syncWallpaperModeDom(nextPhase);
    setWallpaperModePhase(nextPhase);
  };

  const advanceWallpaperBrandAnimation = () => {
    const nextPhase = wallpaperModePhase === "fading"
      ? "arriving"
      : wallpaperModePhase === "arriving"
        ? "active"
        : wallpaperModePhase === "returning"
          ? "settling"
          : wallpaperModePhase === "settling"
            ? "idle"
            : null;
    if (!nextPhase) return;
    syncWallpaperModeDom(nextPhase);
    setWallpaperModePhase(nextPhase);
  };

  const brandIsFadingOut = wallpaperModePhase === "fading" || wallpaperModePhase === "returning";
  const brandIsFadingIn = wallpaperModePhase === "arriving" || wallpaperModePhase === "settling";
  const brandAnimation = reduceMotion
    ? { opacity: 1, y: 0, scaleX: 1, scaleY: 1 }
    : brandIsFadingOut
      ? {
          opacity: [1, 1, 1, 0.65, 0],
          y: [0, -18, 5, -7, 8],
          scaleX: [1, 0.94, 1.06, 0.98, 1.04],
          scaleY: [1, 1.1, 0.94, 1.04, 0.92],
        }
      : brandIsFadingIn
        ? {
            opacity: [0, 0.72, 1, 1, 1],
            y: [8, -18, 6, -6, 0],
            scaleX: [1.04, 0.94, 1.06, 0.98, 1],
            scaleY: [0.92, 1.1, 0.94, 1.04, 1],
          }
        : { opacity: 1, y: 0, scaleX: 1, scaleY: 1 };
  const brandTransition = brandIsFadingOut
    ? { duration: WALLPAPER_BRAND_OUT_MS / 1000, times: [0, 0.34, 0.58, 0.78, 1], ease: "easeInOut" as const }
    : brandIsFadingIn
      ? { duration: WALLPAPER_BRAND_IN_MS / 1000, times: [0, 0.3, 0.56, 0.78, 1], ease: [0.22, 1, 0.36, 1] as const }
      : { duration: 0 };

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
    <div
      className="pc-home-root relative mx-auto max-w-6xl pb-8"
      data-wallpaper-mode={wallpaperModeAtCorner ? "true" : undefined}
      data-wallpaper-phase={wallpaperModePhase}
      data-search-active={searchActive ? "true" : undefined}
    >
      <div
        className="pc-home-overlay-scrollbar"
        data-visible={homeScrollbar.visible ? "true" : undefined}
        aria-hidden="true"
      >
        <span
          style={{
            height: `${homeScrollbar.height}px`,
            transform: `translate3d(0, ${homeScrollbar.top}px, 0)`,
          }}
        />
      </div>
      <section className="pc-home-primary-section py-8 sm:py-12">
        <motion.div
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1, delayChildren: 0.06 } },
          }}
          className="pc-home-brand mb-12 text-center"
        >
          <motion.div
            animate={brandAnimation}
            transition={brandTransition}
            onAnimationComplete={advanceWallpaperBrandAnimation}
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
            <motion.button
              type="button"
              aria-label={t("home.logoAlt")}
              aria-pressed={wallpaperModeEnabled}
              onClick={toggleWallpaperMode}
              whileTap={reduceMotion ? undefined : { scale: 0.92 }}
              className="pc-home-wallpaper-toggle block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
            >
              <Image
                src="/images/icons/paladinscat.avif"
                alt=""
                width={80}
                height={80}
                unoptimized
                priority
                className="opacity-90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]"
              />
            </motion.button>
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
              className="pc-home-cat-accent"
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
                  className="pc-home-version absolute left-full top-0 ml-1.5 whitespace-nowrap rounded-sm font-mono text-sm font-medium leading-none tracking-normal text-pc-text-muted drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] transition-colors hover:text-pc-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent"
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
                  className="pc-home-version pc-skeleton absolute left-full top-0 ml-1.5 h-3 w-10 rounded-full"
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
            className="pc-home-tagline mt-1 text-sm text-pc-text-secondary drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
          >
            {t("home.tagline")}
          </motion.p>
          </motion.div>
        </motion.div>

        <div className="pc-home-search">
          <HomeSearch onSearchActiveChange={setSearchActive} />
        </div>
      </section>

      <section
        className="pc-home-explore mx-auto max-w-4xl px-1 py-14 sm:px-4 sm:py-20"
      >
        <motion.h2
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center text-3xl font-bold tracking-tight text-pc-text drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] sm:text-4xl"
        >
          <span className="block">
            {exploreTitleLead.slice(0, exploreTitleAccentStart)}
            <span className="pc-home-platform-accent">
              {exploreTitleLead.slice(exploreTitleAccentStart)}
            </span>
          </span>
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
            <motion.div
              key={href}
              variants={{
                hidden: { opacity: 0, y: 22, scale: 0.97 },
                visible: { opacity: 1, y: 0, scale: 1 },
              }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <MotionLink
                href={href}
                data-card-accent={index === 0 ? "primary" : index === 1 ? "secondary" : "tertiary"}
                whileHover={reduceMotion ? undefined : { y: -6, scale: 1.012 }}
                whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                className="pc-glass pc-home-feature-card group relative flex min-h-44 flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/5 p-6 text-center shadow-lg transition-shadow duration-300 group-hover:shadow-pc-card-hover"
              >
              <span
                aria-hidden="true"
                className="pc-home-card-aura absolute -left-20 -top-24 h-52 w-52 rounded-full opacity-35 blur-3xl transition-all duration-500 group-hover:translate-x-10 group-hover:translate-y-8 group-hover:opacity-60"
              />
              <ArrowRight className="pc-home-card-arrow absolute right-5 top-5 h-4 w-4 text-pc-text-muted transition-all duration-300 group-hover:translate-x-1" aria-hidden="true" />
              <motion.span
                whileHover={reduceMotion ? undefined : { rotate: -4, scale: 1.08 }}
                transition={{ type: "spring", stiffness: 300, damping: 16 }}
                className="pc-home-card-icon relative flex h-11 w-11 items-center justify-center rounded-xl border transition-shadow duration-300"
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </motion.span>
              <p className="relative mt-4 text-xs font-bold uppercase tracking-[0.16em] text-pc-text-muted transition-colors duration-300 group-hover:text-pc-text-secondary">{eyebrow}</p>
              <h3 className="relative mt-2 text-xl font-bold text-pc-text">{title}</h3>
              <span className="pc-home-card-rule absolute inset-x-8 bottom-0 h-px origin-center scale-x-0 transition-transform duration-500 group-hover:scale-x-100" aria-hidden="true" />
                </MotionLink>
            </motion.div>
          ))}
        </motion.div>
      </section>

    </div>
  );
}
