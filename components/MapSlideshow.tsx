"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
 */
export default function MapSlideshow() {
  const [index, setIndex] = useState(0);

  // Shuffle order once on mount so it doesn't cycle in the same order
  const [order] = useState(() => {
    const arr = [...MAPS];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % order.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [order.length]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <AnimatePresence mode="wait">
        <motion.div
          key={order[index]}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage: `url("${order[index]}")`,
            backgroundPosition: "center",
            backgroundSize: "cover",
            filter: "brightness(0.25)",
          }}
        />
      </AnimatePresence>
    </div>
  );
}
