"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getWallpaperEnabled,
  resolveCustomWallpapers,
  type ResolvedCustomWallpaper,
  WALLPAPER_CHANGE_EVENT,
} from "@/lib/wallpaper-preference";

// All 12 Paladins map wallpapers — AVIF format
const MAPS = [
  "/images/maps/Ascension_Peak_Overhead_Layout.avif",
  "/images/maps/Brightmarsh_Overhead_Layout.avif",
  "/images/maps/Dragon_Arena_Overhead_Layout.avif",
  "/images/maps/Fish Market Overhead.avif",
  "/images/maps/Foremans_Rise_Overhead_Layout.avif",
  "/images/maps/Frog_Isle_Overhead_Layout.avif",
  "/images/maps/Jaguar_Falls_Overhead_Layout.avif",
  "/images/maps/Serpent_Beach_Overhead_Layout.avif",
  "/images/maps/Snowfall_Junction_Overhead_Layout.avif",
  "/images/maps/Splotstone_Quarry_Overhead_Layout.avif",
  "/images/maps/Stone_Keep_Overhead_Layout.avif",
  "/images/maps/Warders_Gate_Overhead_Layout.avif",
];

const INTERVAL_MS = 10_000;

/**
 * MapSlideshow — rotating background slideshow of Paladins maps.
 *
 * Crossfade transition between maps, cycling every 10 seconds.
 * Starts with a deterministic first map to avoid SSR hydration mismatch,
 * then shuffles order client-side after mount.
 */
export default function MapSlideshow() {
  const [wallpaperEnabled, setWallpaperEnabled] = useState(true);
  const [customWallpapers, setCustomWallpapers] = useState<ResolvedCustomWallpaper[]>([]);
  // Deterministic on server: always start at index 0
  const [index, setIndex] = useState(0);
  // Null until client mounts and shuffles
  const [order, setOrder] = useState<string[] | null>(null);
  const mounted = useRef(false);

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
      const arr = [...MAPS];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      setOrder(arr);
    }
  }, []);

  const slides = useMemo(
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
  const currentMap = slides?.[index] ?? MAPS[0];

  if (!wallpaperEnabled) {
    return <div className="fixed inset-0 -z-10 bg-pc-bg" aria-hidden="true" />;
  }

  if (customWallpapers.length === 1) {
    return (
      <div
        className="fixed inset-0 -z-10 bg-pc-bg"
        aria-hidden="true"
        style={{
          backgroundImage: `url(${JSON.stringify(customWallpapers[0].source)})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          filter: "brightness(0.4)",
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true" style={{ backgroundColor: "var(--pc-bg)" }}>
      <AnimatePresence>
        <motion.div
          key={currentMap}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage: `url("${currentMap}")`,
            backgroundPosition: "center",
            backgroundSize: "cover",
            filter: "brightness(0.4)",
          }}
        />
      </AnimatePresence>
    </div>
  );
}
