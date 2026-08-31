/** Card component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 */
import type { HTMLAttributes, ReactNode } from "react";
import { StableMetricValue } from "@/components/async-state";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  children: ReactNode;
  hover?: boolean;
  wide?: boolean;
  opaque?: boolean;
}

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 */
export default function Card({
  title,
  children,
  className = "",
  hover = true,
  wide,
  style,
  opaque = false,
  onMouseEnter,
  onMouseLeave,
  ...props
}: CardProps) {
  const baseStyle = hover
    ? { boxShadow: "var(--shadow-md)", transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.25s ease" }
    : { borderColor: "var(--pc-border)", boxShadow: "var(--shadow-sm)" };

  return (
    <div
      {...props}
      className={`pc-card ${wide ? 'max-w-2xl' : ''} ${opaque ? 'pc-card--opaque' : ''} ${className}`}
      style={{ ...baseStyle, ...style }}
      onMouseEnter={(e) => {
        onMouseEnter?.(e);
        if (hover) {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-card-hover)";
        }
      }}
      onMouseLeave={(e) => {
        onMouseLeave?.(e);
        if (hover) {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = style?.boxShadow?.toString() || "var(--shadow-md)";
        }
      }}
    >
      {title && <div className="pc-card-title">{title}</div>}
      {children}
    </div>
  );
}

export interface StatsItem {
  value: string | number;
  label: string;
}

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 */
export function StatsGrid({ items }: { items: StatsItem[] }) {
  return (
    <div className="pc-stats-grid">
      {items.map((item) => (
        <div key={item.label}>
          <div className="pc-stats-value"><StableMetricValue value={item.value} /></div>
          <div className="pc-stats-label">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
