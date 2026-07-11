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

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/champions", label: "Champions", icon: Sword },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/players", label: "Players", icon: Users },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-max max-w-[calc(100vw-1rem)] -translate-x-1/2 sm:bottom-6">
      <div className="flex items-center gap-1 rounded-2xl border border-pc-border bg-pc-bg-elevated/90 px-2 py-2 shadow-lg backdrop-blur-md">
        {items.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-11 w-12 min-w-0 flex-col items-center justify-center rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-pc-accent bg-pc-accent/10"
                  : "text-pc-text-muted hover:text-pc-text hover:bg-pc-bg-secondary"
              }`}
              aria-label={item.label}
            >
              <item.icon
                className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.5]"}`}
              />
              <span className="text-xs mt-0.5 font-medium">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("paladinscat:open-site-menu"))}
          className="flex h-11 w-12 min-w-0 flex-col items-center justify-center rounded-xl text-pc-text-muted transition-all duration-200 hover:bg-pc-bg-secondary hover:text-pc-text"
          aria-label="More navigation"
        >
          <Menu className="h-5 w-5 stroke-[1.5]" />
          <span className="mt-0.5 text-xs font-medium">More</span>
        </button>
      </div>
    </div>
  );
}
