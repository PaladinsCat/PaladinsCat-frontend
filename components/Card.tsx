import type { HTMLAttributes, ReactNode } from "react";

/**
 * Card component — elevated surface with hover lift effect
 * Hover: translateY(-2px) + shadow increase (from --shadow-md to --shadow-card-hover)
 * Entry animation: fadeInUp via pc-animate-in class
 * Pattern source: superdesign skill (card hover lift + shadow)
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  children: ReactNode;
  hover?: boolean;
  wide?: boolean;
}

export default function Card({
  title,
  children,
  className = "",
  hover = true,
  wide,
  style,
  onMouseEnter,
  onMouseLeave,
  ...props
}: CardProps) {
  const baseStyle = hover
    ? {
        boxShadow: "var(--shadow-md)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.25s ease",
      }
    : {
        borderColor: "var(--pc-border)",
        boxShadow: "var(--shadow-sm)",
      };

  return (
    // Card: elevated bg, border, 16px radius, shadow, hover lift + shadow increase
    <div
      {...props}
      className={`pc-card ${wide ? 'max-w-2xl' : ''} ${className}`}
      style={{ ...baseStyle, ...style }}
      // Hover lift effect: translateY -2px on hover (applied via :hover in CSS)
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

export function StatsGrid({ items }: { items: StatsItem[] }) {
  return (
    <div className="pc-stats-grid">
      {items.map((item) => (
        <div key={item.label}>
          <div className="pc-stats-value">{item.value}</div>
          <div className="pc-stats-label">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
