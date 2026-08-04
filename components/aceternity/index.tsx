"use client";

import { SpotlightCard } from "./SpotlightCard";
import { MovingBorderCard } from "./MovingBorderCard";
import { BackgroundGradientAnimation } from "./BackgroundGradientAnimation";

export { SpotlightCard, MovingBorderCard, BackgroundGradientAnimation };

export function AceternityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden">
      <BackgroundGradientAnimation />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function AceternitySection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <MovingBorderCard className={className}>{children}</MovingBorderCard>;
}

export function AceternityCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <SpotlightCard className={className}>{children}</SpotlightCard>;
}
