"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Sword,
  BarChart3,
  Wrench,
  Users,
  MessageCircle,
  ListTodo,
} from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/champions", label: "Champions", icon: Sword },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/builds", label: "Builds", icon: Wrench },
  { href: "/players", label: "Players", icon: Users },
  { href: "/community", label: "Community", icon: MessageCircle },
  { href: "/matches", label: "Matches", icon: ListTodo },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 px-2 py-2 rounded-2xl bg-pc-bg-elevated/90 backdrop-blur-md border border-pc-border shadow-lg">
        {items.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-12 h-10 rounded-xl transition-all duration-200 ${
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
      </div>
    </div>
  );
}
