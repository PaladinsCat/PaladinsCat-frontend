"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/reduced-motion";

export function BackgroundGradientAnimation() {
  const shouldReduce = useReducedMotion();

  if (shouldReduce) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%]"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </motion.div>
    </div>
  );
}
