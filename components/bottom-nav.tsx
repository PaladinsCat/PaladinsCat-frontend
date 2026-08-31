/** bottom-nav component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Sword,
  BarChart3,
  Users,
  Menu,
} from "lucide-react";
import { useLocalization } from "@/lib/localization-context";

const items = [
  { href: "/", labelKey: "menu.home", icon: Home },
  { href: "/champions", labelKey: "nav.champions", icon: Sword },
  { href: "/stats/performance", labelKey: "nav.stats", icon: BarChart3 },
  { href: "/players", labelKey: "nav.players", icon: Users },
] as const;

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 */
export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLocalization();

  return (
    <div className="fixed bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-1/2 z-50 w-[calc(100vw-1rem)] max-w-sm -translate-x-1/2 sm:bottom-6">
      <div className="grid grid-cols-5 items-center rounded-2xl border border-white/5 pc-glass p-1.5">
        {items.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-12 min-w-0 flex-col items-center justify-center rounded-xl px-0.5 transition-all duration-200 ${
                isActive
                  ? "text-pc-accent bg-pc-accent/10"
                  : "text-pc-text-muted hover:text-pc-text hover:bg-pc-bg-secondary"
              }`}
              aria-label={t(item.labelKey)}
            >
              <item.icon
                className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.5]"}`}
              />
              <span className="mt-0.5 max-w-full truncate text-xs font-medium leading-none">{t(item.labelKey)}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("paladinscat:open-site-menu"))}
          className="flex h-12 min-w-0 flex-col items-center justify-center rounded-xl px-0.5 text-pc-text-muted transition-all duration-200 hover:bg-pc-bg-secondary hover:text-pc-text"
          aria-label={t("bottomNav.moreNavigation")}
        >
          <Menu className="h-5 w-5 stroke-[1.5]" />
          <span className="mt-0.5 text-xs font-medium leading-none">{t("bottomNav.more")}</span>
        </button>
      </div>
    </div>
  );
}
