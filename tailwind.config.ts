import type { Config } from "tailwindcss";

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
        "pc-accent": "#33b6b1",
        "pc-accent-secondary": "#268d89",
        "pc-accent-deep": "#186360",
        "pc-accent-mid": "#23837f",
        "pc-accent-light": "#99dbd8",
        "pc-border": "#3c3f44",
        "pc-text": "#dfdfd6",
        "pc-text-secondary": "#98989f",
        "pc-text-muted": "#6a6a71",
      },
    },
  },
  plugins: [],
};

export default config;
