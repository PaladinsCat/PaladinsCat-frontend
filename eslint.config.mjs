import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    files: ["**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: ["scripts/**/*.{js,mjs}"],
    rules: {
      "@next/next/no-assign-module-variable": "off",
      "react-hooks/rules-of-hooks": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "public/locales/**",
    "next-env.d.ts",
  ]),
]);
