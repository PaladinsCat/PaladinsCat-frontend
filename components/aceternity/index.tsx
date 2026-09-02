/** Compose the Aceternity decorative primitives into reusable page-surface layouts. · refs: none */
"use client";

import { SpotlightCard } from "./SpotlightCard";
import { MovingBorderCard } from "./MovingBorderCard";
import { BackgroundGradientAnimation } from "./BackgroundGradientAnimation";

export { SpotlightCard, MovingBorderCard, BackgroundGradientAnimation };

/** Wrap page children with the animated background and foreground stacking context. · refs: none */
export function AceternityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden">
      <BackgroundGradientAnimation />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/** Group section content with the shared Aceternity spacing and surface treatment.  Returns: `React.JSX.Element`. · refs: none */
export function AceternitySection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <MovingBorderCard className={className}>{children}</MovingBorderCard>;
}

/** Render a bordered content card using the moving-border visual treatment.  Returns: `React.JSX.Element`. · refs: none */
export function AceternityCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <SpotlightCard className={className}>{children}</SpotlightCard>;
}
