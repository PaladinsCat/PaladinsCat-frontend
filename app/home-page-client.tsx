/** Drive the interactive homepage hero, wallpaper mode, and discovery sections. · refs: none */
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { preload } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/reduced-motion";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Sparkles,
  UsersRound,
} from "lucide-react";
import {
  fetchSiteVersion,
  type SiteVersion,
} from "@/lib/api-client";
import HomeSearch from "@/components/home-search";
import { useLocalization } from "@/lib/localization-context";
import { DEFAULT_WALLPAPERS } from "@/lib/wallpaper-images";

const WALLPAPER_BRAND_OUT_MS = 420;
const WALLPAPER_BRAND_IN_MS = 480;
const WALLPAPER_PHASE_FALLBACK_BUFFER_MS = 140;
const WALLPAPER_SCROLL_KEYS = new Set([" ", "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"]);
type WallpaperModePhase = "idle" | "fading" | "arriving" | "active" | "returning" | "settling";
type HomeScrollbarState = { top: number; height: number; visible: boolean };

/** Reflect the wallpaper transition phase on the document root for coordinated styling. · refs: none */
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

/** Render the interactive homepage shell around server-rendered discovery content.  Returns: `React.JSX.Element`. · refs: none */
export default function HomePage({ children }: { children?: ReactNode }) {
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
    let cancelled = false;
    fetchSiteVersion().then((version) => {
      if (!cancelled) setSiteVersion(version);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let animationFrame = 0;
    const requestFrame = typeof window.requestAnimationFrame === "function"
      ? window.requestAnimationFrame.bind(window)
      : (callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 0);
    const cancelFrame = typeof window.cancelAnimationFrame === "function"
      ? window.cancelAnimationFrame.bind(window)
      : window.clearTimeout;
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
      animationFrame = requestFrame(syncHomeScrollbar);
    };
    const resizeObserver = new ResizeObserver(scheduleHomeScrollbarSync);

    scheduleHomeScrollbarSync();
    window.addEventListener("scroll", scheduleHomeScrollbarSync, { passive: true });
    window.addEventListener("resize", scheduleHomeScrollbarSync);
    resizeObserver.observe(document.body);
    return () => {
      if (animationFrame) cancelFrame(animationFrame);
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
    ? { opacity: 1 }
    : brandIsFadingOut
      ? { opacity: [1, 0] }
      : brandIsFadingIn
        ? { opacity: [0, 1] }
        : { opacity: 1 };
  const brandTransition = reduceMotion
    ? { duration: 0 }
    : brandIsFadingOut
      ? { duration: WALLPAPER_BRAND_OUT_MS / 1000, ease: "easeInOut" as const }
      : brandIsFadingIn
        ? { duration: WALLPAPER_BRAND_IN_MS / 1000, ease: [0.22, 1, 0.36, 1] as const }
        : { duration: 0 };

  // The home page's LCP is the first slideshow wallpaper (a CSS background
  // image, which browsers discover late and fetch at low priority). Preload it
  // with high priority so it is in flight before the stylesheet is parsed.
  preload(DEFAULT_WALLPAPERS[0].avif, { as: "image", fetchPriority: "high" });

  const exploreCards = [
    {
      href: "/players",
      icon: UsersRound,
      title: t("menu.playerHub"),
      description: t("home.explorePlayersTitle"),
    },
    {
      href: "/champions",
      icon: BarChart3,
      title: t("nav.champions"),
      description: t("home.exploreMetaTitle"),
    },
    {
      href: "/operations/paladinscat-bot",
      icon: Bot,
      title: t("menu.paladinsCatBot"),
      description: t("home.exploreBotTitle"),
    },
  ];
  const communityCards = [
    {
      href: "https://discord.gg/FXDdbCFPB",
      image: "/images/projects/paladins-impact-project.avif",
      imageAlt: t("home.communityPipLogoAlt"),
      title: t("home.communityPipTitle"),
      description: t("home.communityPipDescription"),
    },
    {
      href: "https://discord.gg/paladinsgame",
      image: "/images/projects/paladins-discord.avif",
      imageAlt: t("home.communityOfficialLogoAlt"),
      title: t("home.communityOfficialTitle"),
      description: t("home.communityOfficialDescription"),
    },
    {
      href: "https://discord.gg/VqYMXAR",
      image: "/images/icons/paladinscat.avif",
      imageAlt: t("home.logoAlt"),
      title: t("home.communityPaladinsCatTitle"),
      description: t("home.communityPaladinsCatDescription"),
    },
    {
      href: "https://discord.gg/YPXJEaNPPe",
      image: "/images/projects/tempest.avif",
      imageAlt: t("home.tempestLogoAlt"),
      title: t("home.communityTempestTitle"),
      description: t("home.communityTempestDescription"),
    },
    {
      href: "https://discord.com/invite/YPWtdVwFPR",
      image: "/images/projects/round-table.avif",
      imageAlt: t("home.communityRoundTableLogoAlt"),
      title: t("home.communityRoundTableTitle"),
      description: t("home.communityRoundTableDescription"),
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
        <div className="pc-home-brand mb-12 text-center">
          <motion.div
            animate={brandAnimation}
            transition={brandTransition}
            onAnimationComplete={advanceWallpaperBrandAnimation}
          >
            <div className="relative mx-auto mb-2 w-fit">
              <span
                aria-hidden="true"
                className="absolute inset-2 -z-10 rounded-full bg-pc-accent/20 blur-xl"
              />
              <button
              type="button"
              aria-label={t("home.logoAlt")}
              aria-pressed={wallpaperModeEnabled}
              onClick={toggleWallpaperMode}
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
              </button>
            </div>
            <h1 className="relative inline-block text-4xl font-semibold tracking-wide drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
              <span className="text-pc-text">{t("home.brandLead")}</span>
              <span className="pc-home-cat-accent">{t("home.brandAccent")}</span>
              {siteVersion?.version ? (
                <Link
                  href="/changelog"
                  aria-label={t("menu.changelog")}
                  title={t("menu.changelog")}
                  className="pc-home-version absolute left-full top-0 ml-1.5 whitespace-nowrap rounded-sm font-mono text-sm font-medium leading-none tracking-normal text-pc-text-muted drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] transition-colors hover:text-pc-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent"
                >
                  {siteVersion.version}
                </Link>
              ) : (
                <span
                  aria-hidden="true"
                  className="pc-home-version pc-skeleton absolute left-full top-0 ml-1.5 h-3 w-10 rounded-full"
                />
              )}
            </h1>
            <p className="pc-home-tagline mt-1 text-sm text-pc-text-secondary drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
              {t("home.tagline")}
            </p>
          </motion.div>
        </div>

        <div className="pc-home-search">
          <HomeSearch onSearchActiveChange={setSearchActive} />
        </div>
      </section>

      <section
        className="pc-home-explore mx-auto max-w-4xl px-1 py-14 sm:px-4 sm:py-20"
      >
        <div className="mb-12">
          <Link
            href="/features"
            aria-label={`${t("home.newFeatures")}: ${t("home.exploreNewFeatures")}`}
            className="pc-glass group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-pc-accent/30 bg-gradient-to-r from-pc-accent/15 via-pc-bg-elevated/80 to-pc-accent-alt/10 px-4 py-4 shadow-lg transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-pc-accent/60 hover:shadow-pc-card-hover sm:px-5"
          >
            <span aria-hidden="true" className="absolute -left-12 -top-16 h-36 w-36 rounded-full bg-pc-accent/20 blur-3xl transition-transform duration-500 group-hover:translate-x-8 group-hover:translate-y-6" />
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-pc-accent/30 bg-pc-accent/10 text-pc-accent">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="relative min-w-0 flex-1">
              <span className="text-sm font-bold text-pc-text">{t("home.newFeatures")}</span>
              <span className="mt-1 block line-clamp-2 text-xs leading-5 text-pc-text-secondary">
                {t("home.exploreNewFeatures")}
              </span>
            </span>
            <ArrowRight className="relative h-5 w-5 shrink-0 text-pc-text-muted transition-transform duration-300 group-hover:translate-x-1 group-hover:text-pc-accent" aria-hidden="true" />
          </Link>
        </div>

        <h2 className="mx-auto max-w-2xl text-center text-3xl font-bold tracking-tight text-pc-text drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] sm:text-4xl">
          <span className="block">
            {exploreTitleLead.slice(0, exploreTitleAccentStart)}
            <span className="pc-home-platform-accent">
              {exploreTitleLead.slice(exploreTitleAccentStart)}
            </span>
          </span>
          <span className="mt-1 block">{t("home.exploreTitleRest")}</span>
        </h2>

        <div className="mt-10 grid gap-4 sm:mt-12 md:grid-cols-3">
          {exploreCards.map(({ href, icon: Icon, title, description }, index) => (
            <Link
              key={href}
              href={href}
              data-card-accent={index === 0 ? "primary" : index === 1 ? "secondary" : "tertiary"}
              className="pc-glass pc-home-feature-card group relative flex min-h-44 flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/5 p-6 text-center shadow-lg transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-pc-card-hover"
            >
              <span
                aria-hidden="true"
                className="pc-home-card-aura absolute -left-20 -top-24 h-52 w-52 rounded-full opacity-35 blur-3xl transition-[transform,opacity] duration-300 group-hover:translate-x-10 group-hover:translate-y-8 group-hover:opacity-60"
              />
              <ArrowRight className="pc-home-card-arrow absolute right-5 top-5 h-4 w-4 text-pc-text-muted transition-[transform,color] duration-200 group-hover:translate-x-1" aria-hidden="true" />
              <span className="pc-home-card-icon relative flex h-11 w-11 items-center justify-center rounded-xl border transition-shadow duration-300">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="relative mt-4 text-lg font-bold text-pc-text">{title}</h3>
              <p className="relative mt-2 max-w-[15rem] text-sm leading-5 text-pc-text-secondary">{description}</p>
              <span className="pc-home-card-rule absolute inset-x-8 bottom-0 h-px origin-center scale-x-0 transition-transform duration-500 group-hover:scale-x-100" aria-hidden="true" />
            </Link>
          ))}
        </div>
        {children}

        <h2 className="mx-auto mt-28 max-w-2xl text-center text-3xl font-bold tracking-tight text-pc-text drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] sm:mt-32 sm:text-4xl">
          <span className="pc-home-third-accent block">{t("home.communityTitleLead")}</span>
          <span className="mt-1 block">{t("home.communityTitleRest")}</span>
        </h2>

        <div className="mt-10 grid gap-3 sm:mt-12 sm:grid-cols-2 lg:grid-cols-5">
          {communityCards.map(({ href, image, imageAlt, title, description }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="pc-glass pc-home-feature-card group relative flex min-h-36 flex-col items-center justify-center rounded-2xl border border-white/5 p-4 text-center shadow-lg transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-pc-card-hover"
            >
              <Image
                src={image}
                alt={imageAlt}
                width={56}
                height={56}
                className="h-12 w-12 rounded-xl object-cover drop-shadow-[0_5px_14px_rgba(0,0,0,0.4)]"
              />
              <h3 className="mt-3 text-sm font-bold text-pc-text">{title}</h3>
              <p className="mt-1.5 max-w-[12rem] text-xs leading-5 text-pc-text-secondary">{description}</p>
            </a>
          ))}
        </div>
      </section>

    </div>
  );
}
