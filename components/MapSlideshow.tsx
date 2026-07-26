"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import {
  getWallpaperEnabled,
  resolveCustomWallpapers,
  type ResolvedCustomWallpaper,
  WALLPAPER_CHANGE_EVENT,
} from "@/lib/wallpaper-preference";
import { DEFAULT_WALLPAPERS, type BuiltInWallpaper } from "@/lib/wallpaper-images";
import {
  extractWallpaperAccents,
  HOME_CAT_ACCENT_PROPERTY,
  HOME_PLATFORM_ACCENT_PROPERTY,
  HOME_THIRD_ACCENT_PROPERTY,
} from "@/lib/wallpaper-accent";

type WallpaperSlide = BuiltInWallpaper | string;

const INTERVAL_MS = 10_000;

/**
 * MapSlideshow — rotating background slideshow of Paladins maps.
 *
 * Crossfade transition between maps, cycling every 10 seconds.
 * Starts with a deterministic first map to avoid SSR hydration mismatch,
 * then shuffles order client-side after mount.
 */
export default function MapSlideshow() {
  const pathname = usePathname();
  const [wallpaperEnabled, setWallpaperEnabled] = useState(true);
  const [customWallpapers, setCustomWallpapers] = useState<ResolvedCustomWallpaper[]>([]);
  // Deterministic on server: always start at index 0
  const [index, setIndex] = useState(0);
  // Null until client mounts and shuffles
  const [order, setOrder] = useState<BuiltInWallpaper[] | null>(null);
  const mounted = useRef(false);
  const wallpaperActive = wallpaperEnabled && pathname !== "/stats/activity";

  useEffect(() => {
    let active = true;
    let refreshVersion = 0;
    const syncWallpaperPreferences = async () => {
      const version = ++refreshVersion;
      setWallpaperEnabled(getWallpaperEnabled());
      const wallpapers = await resolveCustomWallpapers().catch(() => []);
      if (active && version === refreshVersion) {
        setCustomWallpapers(wallpapers);
      } else {
        wallpapers.forEach((wallpaper) => {
          if (wallpaper.revoke) URL.revokeObjectURL(wallpaper.source);
        });
      }
    };
    void syncWallpaperPreferences();
    const handleWallpaperChange = () => void syncWallpaperPreferences();
    window.addEventListener(WALLPAPER_CHANGE_EVENT, handleWallpaperChange);
    window.addEventListener("storage", handleWallpaperChange);
    return () => {
      active = false;
      window.removeEventListener(WALLPAPER_CHANGE_EVENT, handleWallpaperChange);
      window.removeEventListener("storage", handleWallpaperChange);
    };
  }, []);

  useEffect(() => () => {
    customWallpapers.forEach((wallpaper) => {
      if (wallpaper.revoke) URL.revokeObjectURL(wallpaper.source);
    });
  }, [customWallpapers]);

  useEffect(() => {
    // Shuffle once on mount
    if (!mounted.current) {
      mounted.current = true;
      const arr = [...DEFAULT_WALLPAPERS];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      setOrder(arr);
    }
  }, []);

  const slides = useMemo<WallpaperSlide[] | null>(
    () => customWallpapers.length > 0 ? customWallpapers.map((wallpaper) => wallpaper.source) : order,
    [customWallpapers, order],
  );

  useEffect(() => {
    setIndex(0);
  }, [customWallpapers]);

  useEffect(() => {
    if (!slides || slides.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [slides]);

  // Before client mount, render the first map in static order (matches SSR)
  const currentWallpaper = slides?.[index] ?? DEFAULT_WALLPAPERS[0];
  const currentWallpaperKey = typeof currentWallpaper === "string" ? currentWallpaper : currentWallpaper.avif;
  const currentWallpaperImage = typeof currentWallpaper === "string"
    ? `url(${JSON.stringify(currentWallpaper)})`
    : `image-set(url(${JSON.stringify(currentWallpaper.avif)}) type("image/avif"), url(${JSON.stringify(currentWallpaper.png)}) type("image/png"))`;
  const currentWallpaperAccentSource = typeof currentWallpaper === "string"
    ? currentWallpaper
    : currentWallpaper.png;

  useEffect(() => {
    let active = true;
    if (!wallpaperActive) {
      document.documentElement.style.removeProperty(HOME_CAT_ACCENT_PROPERTY);
      document.documentElement.style.removeProperty(HOME_PLATFORM_ACCENT_PROPERTY);
      document.documentElement.style.removeProperty(HOME_THIRD_ACCENT_PROPERTY);
      return () => { active = false; };
    }

    void extractWallpaperAccents(currentWallpaperAccentSource).then(({ primary, secondary, tertiary }) => {
      if (!active) return;
      if (primary) document.documentElement.style.setProperty(HOME_CAT_ACCENT_PROPERTY, primary);
      else document.documentElement.style.removeProperty(HOME_CAT_ACCENT_PROPERTY);
      if (secondary) document.documentElement.style.setProperty(HOME_PLATFORM_ACCENT_PROPERTY, secondary);
      else document.documentElement.style.removeProperty(HOME_PLATFORM_ACCENT_PROPERTY);
      if (tertiary) document.documentElement.style.setProperty(HOME_THIRD_ACCENT_PROPERTY, tertiary);
      else document.documentElement.style.removeProperty(HOME_THIRD_ACCENT_PROPERTY);
    });
    return () => { active = false; };
  }, [currentWallpaperAccentSource, wallpaperActive]);

  useEffect(() => () => {
    document.documentElement.style.removeProperty(HOME_CAT_ACCENT_PROPERTY);
    document.documentElement.style.removeProperty(HOME_PLATFORM_ACCENT_PROPERTY);
    document.documentElement.style.removeProperty(HOME_THIRD_ACCENT_PROPERTY);
  }, []);

  if (!wallpaperActive) {
    return (
      <div
        className={`pc-wallpaper-viewport -z-10 bg-pc-bg${pathname === "/stats/activity" ? " pc-activity-statement-background" : ""}`}
        aria-hidden="true"
      />
    );
  }

  if (customWallpapers.length === 1) {
    return (
      <div
        className="pc-wallpaper-dimmed pc-wallpaper-image pc-wallpaper-viewport -z-10 bg-pc-bg"
        aria-hidden="true"
        style={{
          backgroundImage: `url(${JSON.stringify(customWallpapers[0].source)})`,
        }}
      />
    );
  }

  return (
    <div className="pc-wallpaper-dimmed pc-wallpaper-viewport -z-10 overflow-hidden" aria-hidden="true" style={{ backgroundColor: "var(--pc-bg)" }}>
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={currentWallpaperKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2.1, ease: [0.4, 0, 0.2, 1] }}
          className="pc-wallpaper-image"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage: currentWallpaperImage,
            backfaceVisibility: "hidden",
            transform: "translateZ(0)",
            willChange: "opacity",
          }}
        />
      </AnimatePresence>
    </div>
  );
}
