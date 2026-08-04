"use client";

import { motion, useReducedMotion as useFmReducedMotion } from "framer-motion";

export function MovingBorderCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const shouldReduce = useFmReducedMotion() ?? false;

  return (
    <div className={`relative p-[1px] rounded-xl overflow-hidden ${className}`}>
      {!shouldReduce && (
        <motion.div
          className="absolute inset-0 rounded-xl"
          style={{
            background:
              "conic-gradient(from 0deg, transparent, rgba(110, 220, 180, 0.3), transparent, transparent)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      )}
      <div className="relative bg-[#202127] rounded-xl p-6">{children}</div>
    </div>
  );
}
