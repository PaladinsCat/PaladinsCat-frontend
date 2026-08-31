/** tailwind.config component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 */
import type { Config } from "tailwindcss";
// @ts-expect-error - daisyui has no types
import daisyui from "daisyui";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "pc-bg": "#1b1b1f",
        "pc-bg-secondary": "#161618",
        "pc-bg-elevated": "#202127",
        "pc-accent": "var(--pc-accent)",
        "pc-accent-secondary": "var(--pc-accent-secondary)",
        "pc-accent-deep": "var(--pc-accent-deep)",
        "pc-accent-mid": "var(--pc-accent-mid)",
        "pc-accent-light": "var(--pc-accent-light)",
        "pc-accent-alt": "var(--pc-accent-alt)",
        "pc-accent-third": "var(--pc-accent-third)",
        "pc-border": "#3c3f44",
        "pc-text": "#dfdfd6",
        "pc-text-secondary": "#98989f",
        "pc-text-muted": "#6a6a71",
      },
    },
  },
  plugins: [
    daisyui,
  ],
};

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 */
export default config;
