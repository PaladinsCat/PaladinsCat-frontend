/**
 * Badge component — reusable status/role badges
 * Pattern source: Paladins.guru (Verified/Supporter badges on user content)
 * Variants:
 *   - verified: green accent, checkmark icon, for verified players
 *   - supporter: gold accent, star icon, for supporting members
 *   - ranked: teal accent, trophy icon, for ranked matches/content
 *   - mode: neutral, for match mode labels (Ranked/Unranked)
 *   - default: inherits from parent, no icon
 * Usage: <Badge variant="verified">Verified</Badge>
 */

export type BadgeVariant = "verified" | "supporter" | "ranked" | "mode" | "default";

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

// Color map for badge variants — each has distinct bg + text color
// verified: green (trust), supporter: gold (premium), ranked: teal (brand), mode: neutral
const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  verified: {
    bg: "rgba(34, 197, 94, 0.1)",
    text: "oklch(0.720 0.060 145)", /* green-500 equivalent */
    border: "rgba(34, 197, 94, 0.2)",
  },
  supporter: {
    bg: "rgba(234, 179, 8, 0.1)",
    text: "oklch(0.770 0.120 75)", /* amber-400 equivalent */
    border: "rgba(234, 179, 8, 0.2)",
  },
  ranked: {
    bg: "rgba(51, 182, 177, 0.1)",
    text: "var(--pc-accent)",
    border: "rgba(51, 182, 177, 0.2)",
  },
  mode: {
    bg: "var(--pc-bg)",
    text: "var(--pc-text-muted)",
    border: "var(--pc-border)",
  },
  default: {
    bg: "var(--pc-bg)",
    text: "var(--pc-accent)",
    border: "var(--pc-border)",
  },
};

// Icon components — inline SVGs for zero dependency
const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="mr-1">
    <path d="M2 6l3 3 5-6" />
  </svg>
);

const StarIcon = () => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor" className="mr-1">
    <path d="M6 1l1.5 3.5L11 5l-2.5 2.5L7.5 11 6 8.5 4.5 11 3.5 7.5 1 5l3.5-.5z" />
  </svg>
);

const TrophyIcon = () => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="mr-1">
    <path d="M4 1h4v3.5a2 2 0 01-4 0V1z" />
    <path d="M5 11h2" />
    <path d="M5 8v3" />
  </svg>
);

const iconMap: Record<string, React.ReactNode> = {
  verified: <CheckIcon />,
  supporter: <StarIcon />,
  ranked: <TrophyIcon />,
};

export default function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  const style = variantStyles[variant];
  const icon = iconMap[variant];

  return (
    // Badge: pill shape, inline-flex, small text, distinct bg/border per variant
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
      style={{
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
      }}
    >
      {icon}
      {children}
    </span>
  );
}
