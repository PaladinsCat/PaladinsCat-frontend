"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function PageLayout({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Wait for DOM to settle
    const frame = requestAnimationFrame(() => {
      // Collect all visible structural elements to animate
      const targets: HTMLElement[] = [];

      const collect = (node: Element) => {
        const cls = node.className;
        const tag = node.tagName.toLowerCase();

        // Skip hidden/empty elements
        if (node.hasAttribute("hidden") || (node as HTMLElement).offsetParent === null) return;

        // Tag headings
        if (tag === "h1" || tag === "h2" || tag === "h3") {
          targets.push(node as HTMLElement);
          return;
        }

        // Tag cards
        if (typeof cls === "string" && cls.includes("pc-card")) {
          targets.push(node as HTMLElement);
          return;
        }

        // Tag containers with space-y (flex column layouts)
        if (typeof cls === "string" && cls.includes("space-y-")) {
          targets.push(node as HTMLElement);
          return;
        }

        // Tag grids
        if (typeof cls === "string" && cls.includes("grid grid-cols")) {
          targets.push(node as HTMLElement);
          return;
        }

        // Tag rounded containers with borders (card-like)
        if (typeof cls === "string" && cls.includes("rounded-xl") && cls.includes("border")) {
          targets.push(node as HTMLElement);
          return;
        }

        // Don't recurse into cards/grids
        if (typeof cls === "string" && (cls.includes("pc-card") || cls.includes("grid grid-cols"))) return;

        // Recurse
        for (const child of node.children) {
          collect(child);
        }
      };

      collect(el);

      // Apply staggered animation
      targets.forEach((target, i) => {
        target.style.animation = "none";
        void target.offsetWidth; // force reflow
        target.style.animation = `fadeInUp 0.4s ease-out both`;
        target.style.animationDelay = `${i * 60}ms`;
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <div ref={ref}>
      {children}
    </div>
  );
}
