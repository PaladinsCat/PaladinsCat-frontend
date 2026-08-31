/**
 * Shared chart color constants mapped to CSS design-token variables.
 * Used by Recharts configs where CSS variables are resolved at runtime.
 *
 * Chart series colors
 */
export const chartGreen = "var(--pc-chart-green)";       // #4ade80
/**
 * Defines the chart amber contract used by this module.
 */
export const chartAmber = "var(--pc-chart-amber)";       // #f59e0b
/**
 * Defines the chart red contract used by this module.
 */
export const chartRed = "var(--pc-chart-red)";           // #ef4444
/**
 * Defines the chart violet contract used by this module.
 */
export const chartViolet = "var(--pc-chart-violet)";     // #8b5cf6
/**
 * Defines the chart sky contract used by this module.
 */
export const chartSky = "var(--pc-chart-sky)";           // #06b6d4

/** Default color palette for multi-series charts */
export const chartColors = [chartGreen, chartAmber, chartRed, chartViolet, chartSky];

/** Role colors */
export const roleSentinel = "var(--pc-role-sentinel)";    // #34d399
/**
 * Defines the role support contract used by this module.
 */
export const roleSupport = "var(--pc-role-support)";     // #60a5fa
/**
 * Defines the role flank contract used by this module.
 */
export const roleFlank = "var(--pc-role-flank)";          // #c084fc

/** Chart UI colors */
export const chartText = "var(--pc-chart-text)";         // #F9FAFB
/**
 * Defines the chart text secondary contract used by this module.
 */
export const chartTextSecondary = "var(--pc-chart-text-secondary)"; // #9CA3AF
/**
 * Defines the chart grid contract used by this module.
 */
export const chartGrid = "var(--pc-chart-grid)";          // #1F2937

/** Chart fill helpers (opacity variants for fills/backgrounds) */
export const chartFillGreen = "color-mix(in srgb, var(--pc-chart-green) 15%, transparent)";
/**
 * Defines the chart fill red contract used by this module.
 */
export const chartFillRed = "color-mix(in srgb, var(--pc-chart-red) 15%, transparent)";
/**
 * Defines the chart fill amber contract used by this module.
 */
export const chartFillAmber = "color-mix(in srgb, var(--pc-chart-amber) 15%, transparent)";
/**
 * Defines the chart fill violet contract used by this module.
 */
export const chartFillViolet = "color-mix(in srgb, var(--pc-chart-violet) 15%, transparent)";
/**
 * Defines the chart fill sky contract used by this module.
 */
export const chartFillSky = "color-mix(in srgb, var(--pc-chart-sky) 15%, transparent)";

/** Role fill helpers */
export const roleFillSentinel = "color-mix(in srgb, var(--pc-role-sentinel) 15%, transparent)";
/**
 * Defines the role fill support contract used by this module.
 */
export const roleFillSupport = "color-mix(in srgb, var(--pc-role-support) 15%, transparent)";
/**
 * Defines the role fill flank contract used by this module.
 */
export const roleFillFlank = "color-mix(in srgb, var(--pc-role-flank) 15%, transparent)";
