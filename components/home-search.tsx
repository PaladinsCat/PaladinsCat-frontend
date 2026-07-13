"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useLocalization } from "@/lib/localization-context";

export default function HomeSearch() {
  const { t } = useLocalization();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mx-auto mb-16 max-w-md"
    >
      <form
        action="/search"
        method="GET"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onSubmit={(event) => {
          const formData = new FormData(event.currentTarget);
          if (String(formData.get("q") ?? "").trim() === "") event.preventDefault();
        }}
        className="group flex items-center gap-2"
      >
        <div
          className={`pc-glass relative flex-1 rounded-lg border transition-all duration-200 ease-out hover:scale-[1.02] hover:border-pc-accent-mid hover:shadow-[0_10px_26px_rgba(51,182,177,0.14)] focus-within:scale-[1.02] focus-within:border-pc-accent-mid focus-within:shadow-[0_10px_26px_rgba(51,182,177,0.14)] ${hovered || focused ? "scale-[1.02] border-pc-accent-mid shadow-[0_10px_26px_rgba(51,182,177,0.14)]" : "border-white/5"}`}
        >
          <input
            type="text"
            name="q"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            aria-label={t("search.homeInputLabel")}
            className="w-full rounded-lg bg-transparent px-4 py-2 pr-10 text-sm text-pc-text outline-none transition-colors placeholder:text-pc-text-muted"
          />
          {value.length > 0 && (
            <button
              type="button"
              aria-label={t("search.clear")}
              title={t("search.clear")}
              onClick={() => setValue("")}
              className="absolute inset-y-0 right-3 flex cursor-pointer items-center text-pc-text-muted transition-colors hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          )}
        </div>
        <button
          type="submit"
          aria-label={t("search.submit")}
          className="pc-glass flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/5 text-pc-text-muted transition-colors hover:border-pc-accent-mid hover:text-pc-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-colors ${hovered || focused ? "text-pc-accent" : "text-pc-text-muted group-hover:text-pc-accent group-focus-within:text-pc-accent"}`}><path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        </button>
      </form>
    </motion.div>
  );
}
