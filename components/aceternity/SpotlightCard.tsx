"use client";

import { useReducedMotion } from "@/lib/reduced-motion";
import { useState } from "react";

export function SpotlightCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const shouldReduce = useReducedMotion();
  const [position, setPosition] = useState({ x: 0, y: 0 });

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-white/5 bg-[#202127] p-6 ${className}`}
      onMouseMove={(e) => {
        if (shouldReduce) return;
        const rect = e.currentTarget.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
    >
      {!shouldReduce && (
        <div
          className="pointer-events-none absolute -inset-px opacity-0 transition-opacity group-hover:opacity-100"
          style={{
            background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(110, 220, 180, 0.06), transparent 40%)`,
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
